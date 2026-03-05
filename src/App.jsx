import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Activity, 
  Power, 
  RefreshCw, 
  Thermometer, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  LayoutDashboard,
  Eye,
  X,
  Lock,
  Droplets,
  Gauge
} from 'lucide-react'
import axios from 'axios'
import './App.css'

const USER_ID = "68342449de0cc1bcc74c042a"

function App() {
  const [devices, setDevices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const resp = await axios.get(`/api/user/${USER_ID}/tuya/devices/data`)
      if (resp.data.statusCode === "S1000") {
        setDevices(resp.data.content)
        setError(null)
      } else {
        setError(resp.data.message || "Failed to fetch data")
      }
    } catch (err) {
      setError("Server is offline or unreachable")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const toggleSwitch = async (deviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'true' ? false : true
      const resp = await axios.put(`/api/user/${USER_ID}/tuya/device/${deviceId}/switch/${newStatus}`)
      if (resp.data.content && resp.data.content.includes('"success":true')) {
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            switch: String(newStatus)
          }
        }))
        setTimeout(fetchData, 2000)
      }
    } catch (err) {
      console.error("Control failed", err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="portal-container">
      <header className="header">
        <div className="logo-section">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="logo-icon"
          >
            <Shield size={32} color="#06b6d4" />
          </motion.div>
          <div>
            <h1>Magma Tuya Portal</h1>
            <p className="subtitle">Advanced Device Management System</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="stats-mini">
            <div className="stat-pill">
              <Activity size={14} className="text-cyan" />
              <span>{Object.keys(devices).length} Units</span>
            </div>
          </div>
          <button 
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <main className="dashboard">
        {loading ? (
          <div className="loader-container">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="main-loader"
            >
              <RefreshCw size={48} color="#06b6d4" />
            </motion.div>
            <p>Scanning Network...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={48} color="#f43f5e" />
            <p>{error}</p>
            <button onClick={fetchData} className="retry-btn">Re-initialize</button>
          </div>
        ) : (
          <motion.div 
            className="device-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {Object.entries(devices).map(([id, data], index) => (
                <DeviceCard 
                  key={id} 
                  id={id} 
                  data={data} 
                  index={index}
                  onToggle={() => toggleSwitch(id, data.switch)}
                  onView={() => setSelectedDevice({ id, data })}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedDevice && (
          <DeviceModal 
            device={selectedDevice} 
            onClose={() => setSelectedDevice(null)} 
          />
        )}
      </AnimatePresence>

      <footer className="footer">
        <p>© 2026 Magma SenzAgro AI. Cloud Nexus Active.</p>
      </footer>
    </div>
  )
}

function DeviceCard({ id, data, index, onToggle, onView }) {
  const isOn = data.switch === 'true'
  const isOnline = data.online_state === 'online' || !data.online_state
  const isMotor = data.cur_voltage !== undefined || data.cur_current !== undefined

  return (
    <motion.div 
      className={`device-card-modern ${isMotor ? 'motor' : 'valve'} ${isOn ? 'active' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <div className="card-glass-overlay"></div>
      
      <div className="card-top">
        <div className="device-type-badge">
          {isMotor ? <Zap size={14} /> : <Droplets size={14} />}
          <span>{isMotor ? 'Motor' : 'Valve'}</span>
        </div>
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'Active' : 'Offline'}
        </div>
      </div>

      <div className="card-main">
        <h3 className="device-id">{id.slice(-8).toUpperCase()}</h3>
        <p className="device-alias">{isMotor ? 'Power Controller Unit' : 'Flow Control Valve'}</p>
        
        <div className="quick-metrics">
          {isMotor ? (
            <>
              <div className="metric">
                <span className="label">Load</span>
                <span className="value">{data.cur_power ? (data.cur_power / 10).toFixed(1) : '0'}W</span>
              </div>
              <div className="metric border-l">
                <span className="label">V-Line</span>
                <span className="value">{data.cur_voltage ? (data.cur_voltage / 10).toFixed(0) : '0'}V</span>
              </div>
            </>
          ) : (
            <div className="metric">
              <span className="label">Security</span>
              <span className="value">{data.child_lock === 'true' ? <Lock size={14} /> : 'Open'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button className="view-details-btn" onClick={onView}>
          <Eye size={16} />
          Details
        </button>
        <button 
          className={`power-toggle-btn ${isOn ? 'on' : ''}`} 
          onClick={onToggle}
        >
          <Power size={18} />
        </button>
      </div>
    </motion.div>
  )
}

function DeviceModal({ device, onClose }) {
  const { id, data } = device
  const isMotor = data.cur_voltage !== undefined || data.cur_current !== undefined

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Cpu size={24} className="text-cyan" />
            <div>
              <h3>Device Registry: {id}</h3>
              <p>{isMotor ? 'Inductive Load Controller' : 'Hydraulic Flow Valve'}</p>
            </div>
          </div>
          <button className="close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="detail-item">
                <span className="detail-key">{key.replace(/_/g, ' ')}</span>
                <span className="detail-value">{String(value) || '--'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="meta-info">
            <Activity size={14} />
            <span>Last Telemetry: Just now</span>
          </div>
          <button className="done-btn" onClick={onClose}>Dismiss</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default App
