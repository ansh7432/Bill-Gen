"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "./supabase"
import { redirect } from "next/navigation"

// ...existing code...
export type Bill = {
  id: number
  bill_group_id: string
  customer_name: string
  product_name: string
  quantity: number
  price_per_unit: number
  total: number
  paid_amount: number
  remaining_amount: number
  created_at: string
  updated_at: string
  // Add this line to extend the type:
  items?: Array<{product_name: string; quantity: number; price_per_unit: number}>
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

  // First, get the bill to find its group ID
  const { data: bill, error } = await supabase.from("bills").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching bill:", error)
    return null
  }

  // Then, if it has a group ID, get all bills with the same group ID
  if (bill?.bill_group_id) {
    const { data: groupBills, error: groupError } = await supabase
      .from("bills")
      .select("*")
      .eq("bill_group_id", bill.bill_group_id)
      .order("id", { ascending: true })

    if (!groupError && groupBills.length > 0) {
      // Return the first bill with all items as a property
      return {
        ...bill,
        items: groupBills.map(b => ({
          product_name: b.product_name,
          quantity: b.quantity,
          price_per_unit: b.price_per_unit
        }))
      }
    }
  }

  // If no group or error, return the single bill with itself as the only item
  return {
    ...bill,
    items: [{
      product_name: bill.product_name,
      quantity: bill.quantity,
      price_per_unit: bill.price_per_unit
    }]
  }
}

export async function createBill(formData: FormData) {
  const supabase = createServerClient()

  const customer_name = (formData.get("customer_name") as string) || ""
  
  // Generate a unique bill group ID for this transaction
  const bill_group_id = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

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
    
    const paidAmount = Number(formData.get("paidAmount") || "0")
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

  for (const item of items) {
    const { error } = await supabase.from("bills").insert({
      bill_group_id, // Use the same group ID for all items
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
  
  // First get the existing bill to get its group_id
  const { data: existingBill } = await supabase
    .from("bills")
    .select("bill_group_id")
    .eq("id", id)
    .single()
    
  // Use existing bill_group_id or create a new one
  const bill_group_id = existingBill?.bill_group_id || 
    `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  
  const customer_name = formData.get("customer_name") as string
  
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
    
    items.push({
      product_name,
      quantity, 
      price_per_unit,
      total,
      paid_amount: 0,
      remaining_amount: 0
    })
    
    idx++
  }
  
  const paidAmount = Number(formData.get("paidAmount") || "0")
  const totalSum = items.reduce((sum, item) => sum + item.total, 0)
  
  items.forEach(item => {
    item.paid_amount = totalSum > 0 ? (paidAmount * item.total) / totalSum : 0
    item.remaining_amount = item.total - item.paid_amount
  })

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
  
  await supabase
    .from("bills")
    .delete()
    .eq("bill_group_id", bill_group_id)
    .neq("id", id)
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    console.log("Adding new bill:", {
      customer_name,
      ...item
    })
    
    const { error } = await supabase.from("bills").insert({
      bill_group_id, // Add this line
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