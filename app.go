package main

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"tinygo.org/x/bluetooth"
)

// Bluetooth adapter
var adapter = bluetooth.DefaultAdapter

// Bluetooth UUIDs and constants
const (
	deskNamePrefix        = "Desk"
	uuidMoveStr           = "99fa0002-338a-1024-8a49-009c0215f78a"
	uuidHeightStr         = "99fa0021-338a-1024-8a49-009c0215f78a"
	uuidReferenceInputStr = "99fa0031-338a-1024-8a49-009c0215f78a"
	minHeightMeters       = 0.62
	maxHeightMeters       = 1.27
	heightStepMM          = 10.0 // 1cm step for manual movement
	moveTimeout           = 20 * time.Second
	movePollInterval      = 200 * time.Millisecond
)

// Bluetooth commands
var (
	cmdWakeup = []byte{0xFE, 0x00}
	cmdStop   = []byte{0xFF, 0x00}
)

// Parsed UUIDs (initialized once)
var (
	moveUUID      bluetooth.UUID
	heightUUID    bluetooth.UUID
	referenceUUID bluetooth.UUID
	uuidOnce      sync.Once
)

// LogLevel represents the severity of a log message
type LogLevel string

const (
	LogInfo  LogLevel = "INFO"
	LogWarn  LogLevel = "WARN"
	LogError LogLevel = "ERROR"
)

// LogEntry represents a single log message
type LogEntry struct {
	Level     LogLevel `json:"level"`
	Message   string   `json:"message"`
	Timestamp string   `json:"timestamp"`
}

// ConnectionStatus represents the desk connection state
type ConnectionStatus int

const (
	StatusNotConnected ConnectionStatus = iota
	StatusConnected
	StatusUnknown
)

func (s ConnectionStatus) String() string {
	switch s {
	case StatusConnected:
		return "CONNECTED"
	case StatusNotConnected:
		return "NOT_CONNECTED"
	default:
		return "UNKNOWN"
	}
}

// App is the main application struct
type App struct {
	ctx      context.Context
	desk     bluetooth.Device
	mu       sync.Mutex
	haveDesk bool
	isMoving bool
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	if err := adapter.Enable(); err != nil {
		a.emitLog(LogError, "Failed to enable Bluetooth: "+err.Error())
		return
	}

	// Parse UUIDs once
	uuidOnce.Do(func() {
		var err error
		moveUUID, err = bluetooth.ParseUUID(uuidMoveStr)
		if err != nil {
			panic("invalid move UUID: " + err.Error())
		}
		heightUUID, err = bluetooth.ParseUUID(uuidHeightStr)
		if err != nil {
			panic("invalid height UUID: " + err.Error())
		}
		referenceUUID, err = bluetooth.ParseUUID(uuidReferenceInputStr)
		if err != nil {
			panic("invalid reference UUID: " + err.Error())
		}
	})

	a.emitLog(LogInfo, "Bluetooth adapter enabled")

	// Auto-connect to desk
	go a.autoConnect()
}

// autoConnect tries to connect to the desk and fetch initial height
func (a *App) autoConnect() {
	a.emitLog(LogInfo, "Connecting to desk...")

	_, err := a.getOrConnectDesk()
	if err != nil {
		a.emitLog(LogWarn, "Auto-connect failed: "+err.Error())
		return
	}

	height, err := a.GetHeight()
	if err != nil {
		a.emitLog(LogWarn, "Failed to read height: "+err.Error())
		return
	}

	a.emitHeight(height)
	a.emitLog(LogInfo, fmt.Sprintf("Current height: %.1f cm", height/10))
}

// emitLog sends a log entry to the frontend
func (a *App) emitLog(level LogLevel, message string) {
	entry := LogEntry{
		Level:     level,
		Message:   message,
		Timestamp: time.Now().Format("15:04:05"),
	}
	runtime.EventsEmit(a.ctx, "log", entry)
}

// emitHeight sends the current height to the frontend
func (a *App) emitHeight(heightMM float64) {
	runtime.EventsEmit(a.ctx, "height", heightMM)
}

// emitConnectionStatus sends the connection status to the frontend
func (a *App) emitConnectionStatus(status string) {
	runtime.EventsEmit(a.ctx, "connection", status)
}

// CheckConnection returns the current connection status
func (a *App) CheckConnection() string {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.haveDesk {
		return StatusConnected.String()
	}
	return StatusNotConnected.String()
}

// IsMoving returns whether the desk is currently moving
func (a *App) IsMoving() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.isMoving
}

// MoveByStep moves the desk up or down by 1cm
func (a *App) MoveByStep(up bool) error {
	currentMM, err := a.GetHeight()
	if err != nil {
		a.emitLog(LogError, "Failed to read height: "+err.Error())
		return err
	}

	var targetMM float64
	if up {
		targetMM = currentMM + heightStepMM
	} else {
		targetMM = currentMM - heightStepMM
	}

	// Clamp to valid range
	minMM := minHeightMeters * 1000
	maxMM := maxHeightMeters * 1000
	if targetMM < minMM {
		targetMM = minMM
	}
	if targetMM > maxMM {
		targetMM = maxMM
	}

	direction := "down"
	if up {
		direction = "up"
	}
	a.emitLog(LogInfo, fmt.Sprintf("Moving %s to %.1f cm", direction, targetMM/10))

	return a.MoveToHeight(targetMM)
}

// MoveToHeight moves the desk to the specified height in mm
func (a *App) MoveToHeight(targetMM float64) error {
	targetMeters := targetMM / 1000.0

	if targetMeters < minHeightMeters || targetMeters > maxHeightMeters {
		errMsg := fmt.Sprintf("Target height %.1f cm out of range (%.0f - %.0f cm)",
			targetMM/10, minHeightMeters*100, maxHeightMeters*100)
		a.emitLog(LogError, errMsg)
		return fmt.Errorf("target height out of range")
	}

	dev, err := a.getOrConnectDesk()
	if err != nil {
		a.emitLog(LogError, "Connection failed: "+err.Error())
		return fmt.Errorf("connect: %w", err)
	}

	// Find required characteristics
	cmdChar, refChar, err := a.findMoveCharacteristics(dev)
	if err != nil {
		a.emitLog(LogError, "Characteristics not found: "+err.Error())
		return err
	}

	// Check if already at target
	currentMeters, _, err := a.getHeightAndSpeed()
	if err == nil && math.Abs(currentMeters-targetMeters) < 0.002 {
		a.emitLog(LogInfo, "Already at target height")
		return nil
	}

	// Mark as moving
	a.mu.Lock()
	a.isMoving = true
	a.mu.Unlock()
	defer func() {
		a.mu.Lock()
		a.isMoving = false
		a.mu.Unlock()
	}()

	// Wake up and prepare
	cmdChar.WriteWithoutResponse(cmdWakeup)
	cmdChar.WriteWithoutResponse(cmdStop)

	// Calculate target payload
	raw := metersToRaw(targetMeters)
	payload := []byte{byte(raw), byte(raw >> 8)}

	// Move loop
	timeout := time.After(moveTimeout)
	ticker := time.NewTicker(movePollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			a.emitLog(LogError, "Timeout: target height not reached")
			return errors.New("timeout")
		case <-ticker.C:
			refChar.WriteWithoutResponse(payload)

			currentMeters, speed, err := a.getHeightAndSpeed()
			if err != nil {
				continue
			}

			a.emitHeight(currentMeters * 1000)

			if speed == 0 && math.Abs(currentMeters-targetMeters) < 0.003 {
				a.emitLog(LogInfo, fmt.Sprintf("Target height %.1f cm reached", targetMM/10))
				return nil
			}
		}
	}
}

// GetHeight returns the current desk height in mm
func (a *App) GetHeight() (float64, error) {
	dev, err := a.getOrConnectDesk()
	if err != nil {
		return 0, err
	}

	char, err := a.findHeightCharacteristic(dev)
	if err != nil {
		return 0, err
	}

	buf := make([]byte, 4)
	n, err := char.Read(buf)
	if err != nil {
		return 0, err
	}
	if n < 2 {
		return 0, fmt.Errorf("invalid payload length: %d", n)
	}

	rawHeight := int(buf[0]) | int(buf[1])<<8
	meters := rawToMeters(rawHeight)

	return meters * 1000.0, nil
}

// getHeightAndSpeed returns height in meters and speed in m/s
func (a *App) getHeightAndSpeed() (meters float64, speed float64, err error) {
	dev, err := a.getOrConnectDesk()
	if err != nil {
		return 0, 0, err
	}

	char, err := a.findHeightCharacteristic(dev)
	if err != nil {
		return 0, 0, err
	}

	buf := make([]byte, 4)
	n, err := char.Read(buf)
	if err != nil {
		return 0, 0, fmt.Errorf("read height: %w", err)
	}
	if n < 4 {
		return 0, 0, fmt.Errorf("invalid payload: len=%d", n)
	}

	rawHeight := int(buf[0]) | int(buf[1])<<8
	rawSpeed := int16(buf[2]) | int16(buf[3])<<8

	return rawToMeters(rawHeight), float64(rawSpeed) / 10000.0, nil
}

// getOrConnectDesk returns the connected desk or connects to it
func (a *App) getOrConnectDesk() (bluetooth.Device, error) {
	a.mu.Lock()
	if a.haveDesk {
		dev := a.desk
		a.mu.Unlock()
		return dev, nil
	}
	a.mu.Unlock()

	a.emitLog(LogInfo, "Scanning for desk...")

	var found *bluetooth.ScanResult
	err := adapter.Scan(func(ad *bluetooth.Adapter, res bluetooth.ScanResult) {
		if strings.HasPrefix(res.LocalName(), deskNamePrefix) {
			r := res
			found = &r
			ad.StopScan()
		}
	})

	if err != nil {
		a.emitLog(LogError, "Bluetooth scan failed: "+err.Error())
		a.emitConnectionStatus(StatusNotConnected.String())
		return bluetooth.Device{}, fmt.Errorf("scan failed: %w", err)
	}

	if found == nil {
		a.emitLog(LogWarn, "No desk found")
		a.emitConnectionStatus(StatusNotConnected.String())
		return bluetooth.Device{}, errors.New("desk not found")
	}

	a.emitLog(LogInfo, "Desk found: "+found.LocalName())

	dev, err := adapter.Connect(found.Address, bluetooth.ConnectionParams{})
	if err != nil {
		a.emitLog(LogError, "Connection failed: "+err.Error())
		a.emitConnectionStatus(StatusNotConnected.String())
		return bluetooth.Device{}, fmt.Errorf("connect failed: %w", err)
	}

	a.mu.Lock()
	a.desk = dev
	a.haveDesk = true
	a.mu.Unlock()

	a.emitLog(LogInfo, "Connected to: "+found.LocalName())
	a.emitConnectionStatus(StatusConnected.String())
	return dev, nil
}

// findHeightCharacteristic finds the height characteristic
func (a *App) findHeightCharacteristic(dev bluetooth.Device) (bluetooth.DeviceCharacteristic, error) {
	services, err := dev.DiscoverServices(nil)
	if err != nil {
		return bluetooth.DeviceCharacteristic{}, fmt.Errorf("discover services: %w", err)
	}

	for _, s := range services {
		chars, _ := s.DiscoverCharacteristics(nil)
		for _, ch := range chars {
			if ch.UUID().String() == heightUUID.String() {
				return ch, nil
			}
		}
	}

	return bluetooth.DeviceCharacteristic{}, errors.New("height characteristic not found")
}

// findMoveCharacteristics finds both move and reference characteristics
func (a *App) findMoveCharacteristics(dev bluetooth.Device) (cmdChar, refChar bluetooth.DeviceCharacteristic, err error) {
	services, err := dev.DiscoverServices(nil)
	if err != nil {
		return bluetooth.DeviceCharacteristic{}, bluetooth.DeviceCharacteristic{}, fmt.Errorf("discover services: %w", err)
	}

	var foundCmd, foundRef bool
	for _, s := range services {
		chars, _ := s.DiscoverCharacteristics(nil)
		for _, ch := range chars {
			if ch.UUID().String() == moveUUID.String() {
				cmdChar = ch
				foundCmd = true
			}
			if ch.UUID().String() == referenceUUID.String() {
				refChar = ch
				foundRef = true
			}
		}
	}

	if !foundCmd {
		return bluetooth.DeviceCharacteristic{}, bluetooth.DeviceCharacteristic{}, errors.New("move characteristic not found")
	}
	if !foundRef {
		return bluetooth.DeviceCharacteristic{}, bluetooth.DeviceCharacteristic{}, errors.New("reference characteristic not found")
	}

	return cmdChar, refChar, nil
}

// Helper functions for height conversion
func rawToMeters(raw int) float64 {
	return float64(raw)/10000.0 + minHeightMeters
}

func metersToRaw(meters float64) int {
	return int((meters - minHeightMeters) * 10000)
}
