import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Objectives } from './pages/Objectives'
import { ObjectiveDetail } from './pages/ObjectiveDetail'
import { CheckInPage } from './pages/CheckInPage'
import { Alignment } from './pages/Alignment'
import { People } from './pages/People'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="objectives" element={<Objectives />} />
        <Route path="objectives/:id" element={<ObjectiveDetail />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="alignment" element={<Alignment />} />
        <Route path="people" element={<People />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
