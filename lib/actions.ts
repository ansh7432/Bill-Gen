"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "./supabase"
import { redirect } from "next/navigation"

// ...existing code...
export type Bill = {
  id: number
  customer_name: string
  product_name: string
  quantity: number
  price_per_unit: number
  total: number
  paid_amount: number
  remaining_amount: number
  created_at: string
  updated_at: string
}
// ...existing code...

export type BillFormData = {
  product_name: string
  quantity: number
  price_per_unit: number
}

export async function getBills() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("bills").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching bills:", error)
    return []
  }

  return data as Bill[]
}

export async function getBillById(id: number) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("bills").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching bill:", error)
    return null
  }

  return data as Bill
}

export async function createBill(formData: FormData) {
  const supabase = createServerClient()

  const customer_name = (formData.get("customer_name") as string) || ""

  const items: {
    product_name: string
    quantity: number
    price_per_unit: number
    total: number
    paid_amount: number
    remaining_amount: number
  }[] = []

  let idx = 0
  while (formData.has(`items[${idx}][product_name]`)) {
    const product_name = formData.get(`items[${idx}][product_name]`) as string
    const quantity = Number(formData.get(`items[${idx}][quantity]`))
    const price_per_unit = Number(formData.get(`items[${idx}][price_per_unit]`))
    const total = quantity * price_per_unit
    
    // Your code was missing these lines to add calculated values to items array
    const paidAmount = Number(formData.get("paidAmount") || "0")
    // Distribute paid amount proportionally
    const totalSum = items.reduce((sum, item) => sum + item.total, 0) + total
    const paid_amount = totalSum > 0 ? (paidAmount * total) / totalSum : 0
    const remaining_amount = total - paid_amount
    
    items.push({
      product_name,
      quantity, 
      price_per_unit,
      total,
      paid_amount,
      remaining_amount
    })
    
    idx++
  }

  // Add this code to actually insert items into the database
  for (const item of items) {
    const { error } = await supabase.from("bills").insert({
      customer_name,
      product_name: item.product_name,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total: item.total,
      paid_amount: item.paid_amount,
      remaining_amount: item.remaining_amount
    })

    if (error) {
      console.error("Error creating bill:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/")
  redirect("/")
}

export async function updateBill(id: number, formData: FormData) {
  const supabase = createServerClient()
  const customer_name = formData.get("customer_name") as string
  
  // Process all items from the form
  const items: {
    product_name: string
    quantity: number
    price_per_unit: number
    total: number
    paid_amount: number
    remaining_amount: number
  }[] = []

  // Get all products from the form
  let idx = 0;
  while (formData.has(`items[${idx}][product_name]`)) {
    const product_name = formData.get(`items[${idx}][product_name]`) as string
    const quantity = Number(formData.get(`items[${idx}][quantity]`))
    const price_per_unit = Number(formData.get(`items[${idx}][price_per_unit]`))
    const total = quantity * price_per_unit
    
    items.push({
      product_name,
      quantity, 
      price_per_unit,
      total,
      paid_amount: 0, // We'll calculate this after
      remaining_amount: 0 // We'll calculate this after
    })
    
    idx++
  }
  
  // Get the total paid amount from the form
  const paidAmount = Number(formData.get("paidAmount") || "0")
  
  // Calculate the total sum of all items
  const totalSum = items.reduce((sum, item) => sum + item.total, 0)
  
  // Distribute paid amount proportionally
  items.forEach(item => {
    item.paid_amount = totalSum > 0 ? (paidAmount * item.total) / totalSum : 0
    item.remaining_amount = item.total - item.paid_amount
  })

  // Update the first item (the original bill we're editing)
  if (items.length > 0) {
    const firstItem = items[0]
    console.log("Updating bill with:", {
      id,
      customer_name,
      ...firstItem
    })
    
    const { error } = await supabase
      .from("bills")
      .update({
        customer_name,
        product_name: firstItem.product_name,
        quantity: firstItem.quantity,
        price_per_unit: firstItem.price_per_unit,
        total: firstItem.total,
        paid_amount: firstItem.paid_amount,
        remaining_amount: firstItem.remaining_amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating bill:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Insert any additional items as new bills
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    console.log("Adding new bill:", {
      customer_name,
      ...item
    })
    
    const { error } = await supabase.from("bills").insert({
      customer_name,
      product_name: item.product_name,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total: item.total,
      paid_amount: item.paid_amount,
      remaining_amount: item.remaining_amount
    })

    if (error) {
      console.error("Error adding new bill:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/")
  redirect("/")
}

export async function deleteBill(id: number) {
  const supabase = createServerClient()

  const { error } = await supabase.from("bills").delete().eq("id", id)

  if (error) {
    console.error("Error deleting bill:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function getDashboardStats() {
  const bills = await getBills()

  const totalBills = bills.length
  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0)
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paid_amount, 0)
  const totalRemaining = bills.reduce((sum, bill) => sum + bill.remaining_amount, 0)

  return {
    totalBills,
    totalAmount,
    totalPaid,
    totalRemaining,
  }
}