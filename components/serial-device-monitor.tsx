"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface DeviceStatus {
  status: string;
  device_id: string;
  serial_port?: string;
  bottle_id?: string;
  est_remaining_ml?: number;
  pump_cycles?: number;
  total_dispensed_today?: number;
  last_alarm?: string;
  firmware_version?: string;
}

export function SerialDeviceMonitor() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Poll device status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/device/status");
        const status = await response.json();

        setDeviceStatus(status);
        setIsConnected(status.status !== "offline");
        setLastUpdate(new Date());
      } catch (error) {
        console.error("[Serial Device Monitor] Device status polling error:", error);
        setIsConnected(false);
      }
    }, 5000);

    // Initial status check
    fetch("/api/device/status")
      .then((res) => res.json())
      .then((status) => {
        setDeviceStatus(status);
        setIsConnected(status.status !== "offline");
        setLastUpdate(new Date());
      });

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "alarm":
        return "bg-red-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "busy":
        return <AlertTriangle className="h-4 w-4" />;
      case "alarm":
        return <XCircle className="h-4 w-4" />;
      case "offline":
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  if (!deviceStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connecting to device...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
            MethaSpense® Device
          </div>
          <Badge
            variant="outline"
            className={`${getStatusColor(deviceStatus.status)} text-white`}>
            <div className="flex items-center gap-1">
              {getStatusIcon(deviceStatus.status)}
              {deviceStatus.status?.toUpperCase()}
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Device ID</p>
            <p className="text-muted-foreground">{deviceStatus.device_id}</p>
          </div>
          <div>
            <p className="font-medium">Serial Port</p>
            <p className="text-muted-foreground">
              {deviceStatus.serial_port || "COM3"}
            </p>
          </div>
          <div>
            <p className="font-medium">Active Bottle</p>
            <p className="text-muted-foreground">{deviceStatus.bottle_id}</p>
          </div>
          <div>
            <p className="font-medium">Remaining Volume</p>
            <p className="text-muted-foreground">
              {deviceStatus.est_remaining_ml} mL
            </p>
          </div>
          <div>
            <p className="font-medium">Pump Cycles</p>
            <p className="text-muted-foreground">
              {deviceStatus.pump_cycles || 0}
            </p>
          </div>
          <div>
            <p className="font-medium">Today's Total</p>
            <p className="text-muted-foreground">
              {deviceStatus.total_dispensed_today || 0} mL
            </p>
          </div>
        </div>

        {deviceStatus.last_alarm && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">Last Alarm</p>
            <p className="text-sm text-red-600">{deviceStatus.last_alarm}</p>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Firmware: {deviceStatus.firmware_version}</span>
          <span>Last Update: {lastUpdate?.toLocaleTimeString()}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="w-full">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}
