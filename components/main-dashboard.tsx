"use client"

import { useState } from "react"
import { Bill } from "@/lib/actions"
import { DashboardStats } from "./dashboard-stats"
import { CustomerBills } from "./customer-bills"

interface MainDashboardProps {
  bills: Bill[]
}

export function MainDashboard({ bills }: MainDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  return (
    <>
      <DashboardStats 
        bills={bills} 
        selectedCustomer={selectedCustomer} 
      />
      
      <CustomerBills 
        allBills={bills} 
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />
    </>
  )
}