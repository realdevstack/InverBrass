
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "approvals": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"decided_at": string | null,"decision": Database["public"]['Enums']["approval_decision"],"entity_id": string,"entity_type": string,"id": string,"level": Database["public"]['Enums']["approval_level"],"note": string | null,"stage": Database["public"]['Enums']["approval_stage"]
                  }
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decision"?: Database["public"]['Enums']["approval_decision"],"entity_id": string,"entity_type": string,"id"?: string,"level": Database["public"]['Enums']["approval_level"],"note"?: string | null,"stage": Database["public"]['Enums']["approval_stage"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decision"?: Database["public"]['Enums']["approval_decision"],"entity_id"?: string,"entity_type"?: string,"id"?: string,"level"?: Database["public"]['Enums']["approval_level"],"note"?: string | null,"stage"?: Database["public"]['Enums']["approval_stage"]
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": Database["public"]['Enums']["audit_action"],"actor_id": string | null,"at": string,"changed_fields": (string)[] | null,"id": number,"new_values": Json | null,"old_values": Json | null,"record_id": string | null,"table_name": string
                  }
                  Insert: {
                    "action": Database["public"]['Enums']["audit_action"],"actor_id"?: string | null,"at"?: string,"changed_fields"?: (string)[] | null,"id"?: never,"new_values"?: Json | null,"old_values"?: Json | null,"record_id"?: string | null,"table_name": string
                  }
                  Update: {
                    "action"?: Database["public"]['Enums']["audit_action"],"actor_id"?: string | null,"at"?: string,"changed_fields"?: (string)[] | null,"id"?: never,"new_values"?: Json | null,"old_values"?: Json | null,"record_id"?: string | null,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"commission_invoices": {
                  Row: {
                    "base_invoice_amount": number,"commission_amount": number,"commission_invoice_number": string,"commission_percentage": number,"created_at": string,"created_by": string | null,"customer_name": string | null,"gross_invoice_value": number | null,"gst_amount": number,"id": string,"invoice_date": string | null,"oem_id": string | null,"oem_invoice_id": string,"outstanding_amount": number,"payment_due_date": string | null,"payment_received_date": string | null,"payment_status": Database["public"]['Enums']["commission_status"],"remarks": string | null,"tds_amount": number,"updated_at": string
                  }
                  Insert: {
                    "base_invoice_amount": number,"commission_amount": number,"commission_invoice_number": string,"commission_percentage": number,"created_at"?: string,"created_by"?: string | null,"customer_name"?: string | null,"gross_invoice_value"?: number | null,"gst_amount"?: number,"id"?: string,"invoice_date"?: string | null,"oem_id"?: string | null,"oem_invoice_id": string,"outstanding_amount"?: number,"payment_due_date"?: string | null,"payment_received_date"?: string | null,"payment_status"?: Database["public"]['Enums']["commission_status"],"remarks"?: string | null,"tds_amount"?: number,"updated_at"?: string
                  }
                  Update: {
                    "base_invoice_amount"?: number,"commission_amount"?: number,"commission_invoice_number"?: string,"commission_percentage"?: number,"created_at"?: string,"created_by"?: string | null,"customer_name"?: string | null,"gross_invoice_value"?: number | null,"gst_amount"?: number,"id"?: string,"invoice_date"?: string | null,"oem_id"?: string | null,"oem_invoice_id"?: string,"outstanding_amount"?: number,"payment_due_date"?: string | null,"payment_received_date"?: string | null,"payment_status"?: Database["public"]['Enums']["commission_status"],"remarks"?: string | null,"tds_amount"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_invoices_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_invoices_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "commission_invoices_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "commission_invoices_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "oem_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_followup_tracker"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_invoice_balances"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_payment_collection"
      referencedColumns: ["oem_invoice_id"]
    }
                  ]
                },"customer_contacts": {
                  Row: {
                    "created_at": string,"customer_id": string,"designation": string | null,"email": string | null,"id": string,"is_primary": boolean,"name": string,"notes": string | null,"phone": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"customer_id": string,"designation"?: string | null,"email"?: string | null,"id"?: string,"is_primary"?: boolean,"name": string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"designation"?: string | null,"email"?: string | null,"id"?: string,"is_primary"?: boolean,"name"?: string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_contacts_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "approval_requirements": string | null,"billing_address": string | null,"created_at": string,"created_by": string | null,"delivery_address": string | null,"division": string | null,"gem_registration": string | null,"gst_number": string | null,"id": string,"Inverbras_vendor_registration": string | null,"is_active": boolean,"name": string,"payment_terms": string | null,"portal_login_mapping": string | null,"sub_division": string | null,"updated_at": string
                  }
                  Insert: {
                    "approval_requirements"?: string | null,"billing_address"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivery_address"?: string | null,"division"?: string | null,"gem_registration"?: string | null,"gst_number"?: string | null,"id"?: string,"Inverbras_vendor_registration"?: string | null,"is_active"?: boolean,"name": string,"payment_terms"?: string | null,"portal_login_mapping"?: string | null,"sub_division"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "approval_requirements"?: string | null,"billing_address"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivery_address"?: string | null,"division"?: string | null,"gem_registration"?: string | null,"gst_number"?: string | null,"id"?: string,"Inverbras_vendor_registration"?: string | null,"is_active"?: boolean,"name"?: string,"payment_terms"?: string | null,"portal_login_mapping"?: string | null,"sub_division"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"deliveries": {
                  Row: {
                    "closure_status": Database["public"]['Enums']["delivery_closure"],"created_at": string,"created_by": string | null,"delivery_date": string | null,"delivery_number": string | null,"delivery_reference": string | null,"delivery_status": Database["public"]['Enums']["delivery_status"],"grn_number": string | null,"id": string,"location": string | null,"material_acceptance_status": Database["public"]['Enums']["material_acceptance_status"],"oem_invoice_id": string,"pending_balance": number,"proof_of_delivery_document_id": string | null,"quantity_delivered": number,"remarks": string | null,"updated_at": string
                  }
                  Insert: {
                    "closure_status"?: Database["public"]['Enums']["delivery_closure"],"created_at"?: string,"created_by"?: string | null,"delivery_date"?: string | null,"delivery_number"?: string | null,"delivery_reference"?: string | null,"delivery_status"?: Database["public"]['Enums']["delivery_status"],"grn_number"?: string | null,"id"?: string,"location"?: string | null,"material_acceptance_status"?: Database["public"]['Enums']["material_acceptance_status"],"oem_invoice_id": string,"pending_balance"?: number,"proof_of_delivery_document_id"?: string | null,"quantity_delivered": number,"remarks"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "closure_status"?: Database["public"]['Enums']["delivery_closure"],"created_at"?: string,"created_by"?: string | null,"delivery_date"?: string | null,"delivery_number"?: string | null,"delivery_reference"?: string | null,"delivery_status"?: Database["public"]['Enums']["delivery_status"],"grn_number"?: string | null,"id"?: string,"location"?: string | null,"material_acceptance_status"?: Database["public"]['Enums']["material_acceptance_status"],"oem_invoice_id"?: string,"pending_balance"?: number,"proof_of_delivery_document_id"?: string | null,"quantity_delivered"?: number,"remarks"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deliveries_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "oem_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliveries_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_followup_tracker"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "deliveries_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_invoice_balances"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "deliveries_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_payment_collection"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "deliveries_proof_of_delivery_document_id_fkey"
      columns: ["proof_of_delivery_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deliveries_proof_of_delivery_document_id_fkey"
      columns: ["proof_of_delivery_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "created_at": string,"document_type": Database["public"]['Enums']["document_type"],"expiry_date": string | null,"file_name": string | null,"id": string,"issue_date": string | null,"line_item_id": string | null,"mime_type": string | null,"notes": string | null,"oem_id": string | null,"purchase_order_id": string | null,"renewal_reminder_days": number,"requirement_id": string | null,"size_bytes": number | null,"storage_bucket": string,"storage_path": string,"supplier": string | null,"title": string | null,"updated_at": string,"uploaded_by": string | null
                  }
                  Insert: {
                    "created_at"?: string,"document_type": Database["public"]['Enums']["document_type"],"expiry_date"?: string | null,"file_name"?: string | null,"id"?: string,"issue_date"?: string | null,"line_item_id"?: string | null,"mime_type"?: string | null,"notes"?: string | null,"oem_id"?: string | null,"purchase_order_id"?: string | null,"renewal_reminder_days"?: number,"requirement_id"?: string | null,"size_bytes"?: number | null,"storage_bucket"?: string,"storage_path": string,"supplier"?: string | null,"title"?: string | null,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"document_type"?: Database["public"]['Enums']["document_type"],"expiry_date"?: string | null,"file_name"?: string | null,"id"?: string,"issue_date"?: string | null,"line_item_id"?: string | null,"mime_type"?: string | null,"notes"?: string | null,"oem_id"?: string | null,"purchase_order_id"?: string | null,"renewal_reminder_days"?: number,"requirement_id"?: string | null,"size_bytes"?: number | null,"storage_bucket"?: string,"storage_path"?: string,"supplier"?: string | null,"title"?: string | null,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"line_items": {
                  Row: {
                    "client_part_number": string | null,"created_at": string,"description": string | null,"id": string,"line_no": number,"oem_id": string | null,"part_number": string,"product_id": string | null,"quantity": number,"required_delivery_date": string | null,"requirement_id": string,"uom": string | null,"updated_at": string
                  }
                  Insert: {
                    "client_part_number"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"line_no": number,"oem_id"?: string | null,"part_number": string,"product_id"?: string | null,"quantity": number,"required_delivery_date"?: string | null,"requirement_id": string,"uom"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_part_number"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"line_no"?: number,"oem_id"?: string | null,"part_number"?: string,"product_id"?: string | null,"quantity"?: number,"required_delivery_date"?: string | null,"requirement_id"?: string,"uom"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"material_readiness": {
                  Row: {
                    "batch_number": string | null,"created_at": string,"created_by": string | null,"expected_completion_date": string | null,"id": string,"line_item_id": string | null,"production_status": Database["public"]['Enums']["material_status"],"purchase_order_id": string,"qc_status": Database["public"]['Enums']["material_status"],"quantity_ready": number | null,"readiness_number": string | null,"remarks": string | null,"serial_number": string | null,"tentative_pdi_date": string | null,"updated_at": string
                  }
                  Insert: {
                    "batch_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"expected_completion_date"?: string | null,"id"?: string,"line_item_id"?: string | null,"production_status"?: Database["public"]['Enums']["material_status"],"purchase_order_id": string,"qc_status"?: Database["public"]['Enums']["material_status"],"quantity_ready"?: number | null,"readiness_number"?: string | null,"remarks"?: string | null,"serial_number"?: string | null,"tentative_pdi_date"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "batch_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"expected_completion_date"?: string | null,"id"?: string,"line_item_id"?: string | null,"production_status"?: Database["public"]['Enums']["material_status"],"purchase_order_id"?: string,"qc_status"?: Database["public"]['Enums']["material_status"],"quantity_ready"?: number | null,"readiness_number"?: string | null,"remarks"?: string | null,"serial_number"?: string | null,"tentative_pdi_date"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_readiness_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_readiness_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "material_readiness_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    }
                  ]
                },"oem_certifications": {
                  Row: {
                    "certification_type": string,"created_at": string,"document_id": string | null,"expiry_date": string | null,"id": string,"issue_date": string | null,"issued_by": string | null,"oem_id": string,"reference_number": string | null,"reminder_days": number,"updated_at": string
                  }
                  Insert: {
                    "certification_type": string,"created_at"?: string,"document_id"?: string | null,"expiry_date"?: string | null,"id"?: string,"issue_date"?: string | null,"issued_by"?: string | null,"oem_id": string,"reference_number"?: string | null,"reminder_days"?: number,"updated_at"?: string
                  }
                  Update: {
                    "certification_type"?: string,"created_at"?: string,"document_id"?: string | null,"expiry_date"?: string | null,"id"?: string,"issue_date"?: string | null,"issued_by"?: string | null,"oem_id"?: string,"reference_number"?: string | null,"reminder_days"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_certifications_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_certifications_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"oem_contacts": {
                  Row: {
                    "created_at": string,"designation": string | null,"email": string | null,"id": string,"is_primary": boolean,"name": string,"notes": string | null,"oem_id": string,"phone": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"designation"?: string | null,"email"?: string | null,"id"?: string,"is_primary"?: boolean,"name": string,"notes"?: string | null,"oem_id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"designation"?: string | null,"email"?: string | null,"id"?: string,"is_primary"?: boolean,"name"?: string,"notes"?: string | null,"oem_id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_contacts_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_contacts_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_contacts_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_contacts_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"oem_invoices": {
                  Row: {
                    "balance_quantity": number,"courier_details": string | null,"created_at": string,"created_by": string | null,"dispatch_date": string | null,"documents_submitted": string | null,"e_way_bill_number": string | null,"gross_amount": number,"gst_amount": number,"id": string,"invoice_date": string,"invoice_number": string,"is_full_invoice": boolean,"lr_awb_number": string | null,"net_amount": number,"payment_due_date": string | null,"pdi_id": string | null,"purchase_order_id": string,"quantity_invoiced": number,"status": Database["public"]['Enums']["invoice_status"],"updated_at": string
                  }
                  Insert: {
                    "balance_quantity"?: number,"courier_details"?: string | null,"created_at"?: string,"created_by"?: string | null,"dispatch_date"?: string | null,"documents_submitted"?: string | null,"e_way_bill_number"?: string | null,"gross_amount"?: number,"gst_amount"?: number,"id"?: string,"invoice_date": string,"invoice_number": string,"is_full_invoice"?: boolean,"lr_awb_number"?: string | null,"net_amount"?: number,"payment_due_date"?: string | null,"pdi_id"?: string | null,"purchase_order_id": string,"quantity_invoiced": number,"status"?: Database["public"]['Enums']["invoice_status"],"updated_at"?: string
                  }
                  Update: {
                    "balance_quantity"?: number,"courier_details"?: string | null,"created_at"?: string,"created_by"?: string | null,"dispatch_date"?: string | null,"documents_submitted"?: string | null,"e_way_bill_number"?: string | null,"gross_amount"?: number,"gst_amount"?: number,"id"?: string,"invoice_date"?: string,"invoice_number"?: string,"is_full_invoice"?: boolean,"lr_awb_number"?: string | null,"net_amount"?: number,"payment_due_date"?: string | null,"pdi_id"?: string | null,"purchase_order_id"?: string,"quantity_invoiced"?: number,"status"?: Database["public"]['Enums']["invoice_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_invoices_pdi_id_fkey"
      columns: ["pdi_id"]
isOneToOne: false
      referencedRelation: "pdis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_pdi_id_fkey"
      columns: ["pdi_id"]
isOneToOne: false
      referencedRelation: "v_pdi_status"
      referencedColumns: ["pdi_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    }
                  ]
                },"oems": {
                  Row: {
                    "bank_details": string | null,"brand_product_category": string | null,"capacity": number | null,"commission_percentage": number,"country_of_origin": string | null,"created_at": string,"created_by": string | null,"freight_terms": string | null,"govt_vendor_list_source": string | null,"govt_vendor_list_status": Database["public"]['Enums']["oem_approval_status"],"id": string,"is_active": boolean,"lead_time_days": number | null,"moq_rules": string | null,"name": string,"nda_status": string | null,"payment_terms": string | null,"pricing_validity": string | null,"product_portfolio": string | null,"updated_at": string,"warranty_terms": string | null
                  }
                  Insert: {
                    "bank_details"?: string | null,"brand_product_category"?: string | null,"capacity"?: number | null,"commission_percentage"?: number,"country_of_origin"?: string | null,"created_at"?: string,"created_by"?: string | null,"freight_terms"?: string | null,"govt_vendor_list_source"?: string | null,"govt_vendor_list_status"?: Database["public"]['Enums']["oem_approval_status"],"id"?: string,"is_active"?: boolean,"lead_time_days"?: number | null,"moq_rules"?: string | null,"name": string,"nda_status"?: string | null,"payment_terms"?: string | null,"pricing_validity"?: string | null,"product_portfolio"?: string | null,"updated_at"?: string,"warranty_terms"?: string | null
                  }
                  Update: {
                    "bank_details"?: string | null,"brand_product_category"?: string | null,"capacity"?: number | null,"commission_percentage"?: number,"country_of_origin"?: string | null,"created_at"?: string,"created_by"?: string | null,"freight_terms"?: string | null,"govt_vendor_list_source"?: string | null,"govt_vendor_list_status"?: Database["public"]['Enums']["oem_approval_status"],"id"?: string,"is_active"?: boolean,"lead_time_days"?: number | null,"moq_rules"?: string | null,"name"?: string,"nda_status"?: string | null,"payment_terms"?: string | null,"pricing_validity"?: string | null,"product_portfolio"?: string | null,"updated_at"?: string,"warranty_terms"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount_received": number,"balance_outstanding": number,"created_at": string,"created_by": string | null,"customer": string | null,"followup_status": Database["public"]['Enums']["followup_status"],"id": string,"invoice_amount": number,"mode": Database["public"]['Enums']["payment_mode"],"oem_id": string | null,"oem_invoice_id": string,"overdue_days": number,"payment_date": string,"payment_reference": string | null,"proof_document_id": string | null,"remarks": string | null,"status": Database["public"]['Enums']["payment_status"],"terms": string | null,"updated_at": string
                  }
                  Insert: {
                    "amount_received": number,"balance_outstanding"?: number,"created_at"?: string,"created_by"?: string | null,"customer"?: string | null,"followup_status"?: Database["public"]['Enums']["followup_status"],"id"?: string,"invoice_amount"?: number,"mode"?: Database["public"]['Enums']["payment_mode"],"oem_id"?: string | null,"oem_invoice_id": string,"overdue_days"?: number,"payment_date": string,"payment_reference"?: string | null,"proof_document_id"?: string | null,"remarks"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"terms"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "amount_received"?: number,"balance_outstanding"?: number,"created_at"?: string,"created_by"?: string | null,"customer"?: string | null,"followup_status"?: Database["public"]['Enums']["followup_status"],"id"?: string,"invoice_amount"?: number,"mode"?: Database["public"]['Enums']["payment_mode"],"oem_id"?: string | null,"oem_invoice_id"?: string,"overdue_days"?: number,"payment_date"?: string,"payment_reference"?: string | null,"proof_document_id"?: string | null,"remarks"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"terms"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "payments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "payments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "payments_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "oem_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_followup_tracker"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "payments_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_invoice_balances"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "payments_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_payment_collection"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "payments_proof_document_id_fkey"
      columns: ["proof_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_proof_document_id_fkey"
      columns: ["proof_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    }
                  ]
                },"pdis": {
                  Row: {
                    "conducted_by": string | null,"conducted_date": string | null,"created_at": string,"dispatch_clearance": Database["public"]['Enums']["dispatch_clearance"],"id": string,"inspection_agency": Database["public"]['Enums']["inspection_agency"],"inspection_type": Database["public"]['Enums']["pdi_mode"],"inspector_details": string | null,"line_item_id": string | null,"material_readiness_id": string | null,"pdi_number": string | null,"purchase_order_id": string,"quantity_cleared": number,"quantity_offered": number,"quantity_rejected": number,"re_pdi_required": boolean,"rejection_remarks": string | null,"report_document_id": string | null,"result": Database["public"]['Enums']["pdi_result"],"scheduled_date": string | null,"test_certificate_document_id": string | null,"updated_at": string
                  }
                  Insert: {
                    "conducted_by"?: string | null,"conducted_date"?: string | null,"created_at"?: string,"dispatch_clearance"?: Database["public"]['Enums']["dispatch_clearance"],"id"?: string,"inspection_agency"?: Database["public"]['Enums']["inspection_agency"],"inspection_type"?: Database["public"]['Enums']["pdi_mode"],"inspector_details"?: string | null,"line_item_id"?: string | null,"material_readiness_id"?: string | null,"pdi_number"?: string | null,"purchase_order_id": string,"quantity_cleared"?: number,"quantity_offered"?: number,"quantity_rejected"?: number,"re_pdi_required"?: boolean,"rejection_remarks"?: string | null,"report_document_id"?: string | null,"result"?: Database["public"]['Enums']["pdi_result"],"scheduled_date"?: string | null,"test_certificate_document_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "conducted_by"?: string | null,"conducted_date"?: string | null,"created_at"?: string,"dispatch_clearance"?: Database["public"]['Enums']["dispatch_clearance"],"id"?: string,"inspection_agency"?: Database["public"]['Enums']["inspection_agency"],"inspection_type"?: Database["public"]['Enums']["pdi_mode"],"inspector_details"?: string | null,"line_item_id"?: string | null,"material_readiness_id"?: string | null,"pdi_number"?: string | null,"purchase_order_id"?: string,"quantity_cleared"?: number,"quantity_offered"?: number,"quantity_rejected"?: number,"re_pdi_required"?: boolean,"rejection_remarks"?: string | null,"report_document_id"?: string | null,"result"?: Database["public"]['Enums']["pdi_result"],"scheduled_date"?: string | null,"test_certificate_document_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pdis_line_item_id_fkey"
      columns: ["line_item_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_line_item_id_fkey"
      columns: ["line_item_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id"]
    },{
      foreignKeyName: "pdis_material_readiness_id_fkey"
      columns: ["material_readiness_id"]
isOneToOne: false
      referencedRelation: "material_readiness"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "pdis_report_document_id_fkey"
      columns: ["report_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_report_document_id_fkey"
      columns: ["report_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "pdis_test_certificate_document_id_fkey"
      columns: ["test_certificate_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_test_certificate_document_id_fkey"
      columns: ["test_certificate_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    }
                  ]
                },"products": {
                  Row: {
                    "client_part_number": string | null,"compliance_certifications": (string)[],"created_at": string,"created_by": string | null,"currency": string,"description": string | null,"export_restriction": string | null,"hsn_code": string | null,"id": string,"is_active": boolean,"lead_time_days": number | null,"moq": number | null,"oem_id": string | null,"part_number": string,"product_category": string | null,"shelf_life": string | null,"standard_price": number | null,"technical_specifications": string | null,"uom": string | null,"updated_at": string
                  }
                  Insert: {
                    "client_part_number"?: string | null,"compliance_certifications"?: (string)[],"created_at"?: string,"created_by"?: string | null,"currency"?: string,"description"?: string | null,"export_restriction"?: string | null,"hsn_code"?: string | null,"id"?: string,"is_active"?: boolean,"lead_time_days"?: number | null,"moq"?: number | null,"oem_id"?: string | null,"part_number": string,"product_category"?: string | null,"shelf_life"?: string | null,"standard_price"?: number | null,"technical_specifications"?: string | null,"uom"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_part_number"?: string | null,"compliance_certifications"?: (string)[],"created_at"?: string,"created_by"?: string | null,"currency"?: string,"description"?: string | null,"export_restriction"?: string | null,"hsn_code"?: string | null,"id"?: string,"is_active"?: boolean,"lead_time_days"?: number | null,"moq"?: number | null,"oem_id"?: string | null,"part_number"?: string,"product_category"?: string | null,"shelf_life"?: string | null,"standard_price"?: number | null,"technical_specifications"?: string | null,"uom"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "products_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "products_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"purchase_orders": {
                  Row: {
                    "amendment_note": string | null,"committed_deadline": string | null,"created_at": string,"created_by": string | null,"customer": string,"customer_id": string | null,"delivery_schedule": string | null,"documentation_required": string | null,"extension_note": string | null,"extension_requested_at": string | null,"group_head_signoff_at": string | null,"group_head_signoff_by": string | null,"id": string,"line_item_id": string | null,"oem_id": string | null,"part_number": string | null,"partial_delivery_allowed": boolean,"payment_terms": string | null,"pdi_inspector": string | null,"pdi_mode": Database["public"]['Enums']["pdi_mode"] | null,"pdi_required": boolean,"po_copy_document_id": string | null,"po_date": string,"po_number": string,"po_value": number,"quantity_ordered": number,"quotation_id": string,"requirement_id": string,"special_conditions": string | null,"status": Database["public"]['Enums']["po_status"],"taxes_gst": number,"unit_price": number,"updated_at": string,"verification_documents_complete": boolean | null,"verification_feasibility": boolean | null,"verification_price_match": boolean | null,"verification_spec_match": boolean | null,"verified_at": string | null,"verified_by": string | null,"warranty_terms": string | null
                  }
                  Insert: {
                    "amendment_note"?: string | null,"committed_deadline"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer": string,"customer_id"?: string | null,"delivery_schedule"?: string | null,"documentation_required"?: string | null,"extension_note"?: string | null,"extension_requested_at"?: string | null,"group_head_signoff_at"?: string | null,"group_head_signoff_by"?: string | null,"id"?: string,"line_item_id"?: string | null,"oem_id"?: string | null,"part_number"?: string | null,"partial_delivery_allowed"?: boolean,"payment_terms"?: string | null,"pdi_inspector"?: string | null,"pdi_mode"?: Database["public"]['Enums']["pdi_mode"] | null,"pdi_required"?: boolean,"po_copy_document_id"?: string | null,"po_date": string,"po_number": string,"po_value": number,"quantity_ordered": number,"quotation_id": string,"requirement_id": string,"special_conditions"?: string | null,"status"?: Database["public"]['Enums']["po_status"],"taxes_gst"?: number,"unit_price": number,"updated_at"?: string,"verification_documents_complete"?: boolean | null,"verification_feasibility"?: boolean | null,"verification_price_match"?: boolean | null,"verification_spec_match"?: boolean | null,"verified_at"?: string | null,"verified_by"?: string | null,"warranty_terms"?: string | null
                  }
                  Update: {
                    "amendment_note"?: string | null,"committed_deadline"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer"?: string,"customer_id"?: string | null,"delivery_schedule"?: string | null,"documentation_required"?: string | null,"extension_note"?: string | null,"extension_requested_at"?: string | null,"group_head_signoff_at"?: string | null,"group_head_signoff_by"?: string | null,"id"?: string,"line_item_id"?: string | null,"oem_id"?: string | null,"part_number"?: string | null,"partial_delivery_allowed"?: boolean,"payment_terms"?: string | null,"pdi_inspector"?: string | null,"pdi_mode"?: Database["public"]['Enums']["pdi_mode"] | null,"pdi_required"?: boolean,"po_copy_document_id"?: string | null,"po_date"?: string,"po_number"?: string,"po_value"?: number,"quantity_ordered"?: number,"quotation_id"?: string,"requirement_id"?: string,"special_conditions"?: string | null,"status"?: Database["public"]['Enums']["po_status"],"taxes_gst"?: number,"unit_price"?: number,"updated_at"?: string,"verification_documents_complete"?: boolean | null,"verification_feasibility"?: boolean | null,"verification_price_match"?: boolean | null,"verification_spec_match"?: boolean | null,"verified_at"?: string | null,"verified_by"?: string | null,"warranty_terms"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchase_orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "purchase_orders_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_po_copy_document_fk"
      columns: ["po_copy_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_po_copy_document_fk"
      columns: ["po_copy_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "purchase_orders_quotation_id_requirement_id_fkey"
      columns: ["quotation_id","requirement_id"]
isOneToOne: false
      referencedRelation: "quotations"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "purchase_orders_quotation_id_requirement_id_fkey"
      columns: ["quotation_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_past_bids"
      referencedColumns: ["quotation_id","requirement_id"]
    },{
      foreignKeyName: "purchase_orders_quotation_id_requirement_id_fkey"
      columns: ["quotation_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_quotation_turnaround"
      referencedColumns: ["quotation_id","requirement_id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"quantity_commitments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"firm": boolean,"id": string,"line_item_id": string | null,"notes": string | null,"oem_id": string,"quantity": number,"requirement_id": string,"source": string,"sourcing_response_id": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"firm"?: boolean,"id"?: string,"line_item_id"?: string | null,"notes"?: string | null,"oem_id": string,"quantity": number,"requirement_id": string,"source"?: string,"sourcing_response_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"firm"?: boolean,"id"?: string,"line_item_id"?: string | null,"notes"?: string | null,"oem_id"?: string,"quantity"?: number,"requirement_id"?: string,"source"?: string,"sourcing_response_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quantity_commitments_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_sourcing_response_id_fkey"
      columns: ["sourcing_response_id"]
isOneToOne: false
      referencedRelation: "sourcing_responses"
      referencedColumns: ["id"]
    }
                  ]
                },"quotation_versions": {
                  Row: {
                    "change_note": string | null,"changed_by": string | null,"created_at": string,"id": string,"quotation_id": string,"snapshot": NonNullable<Json>,"version": number
                  }
                  Insert: {
                    "change_note"?: string | null,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"quotation_id": string,"snapshot": NonNullable<Json>,"version": number
                  }
                  Update: {
                    "change_note"?: string | null,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"quotation_id"?: string,"snapshot"?: NonNullable<Json>,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "quotations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "v_margin_report"
      referencedColumns: ["quotation_id"]
    },{
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "v_past_bids"
      referencedColumns: ["quotation_id"]
    },{
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "v_pending_quotations"
      referencedColumns: ["quotation_id"]
    },{
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "v_quotation_approvals"
      referencedColumns: ["quotation_id"]
    },{
      foreignKeyName: "quotation_versions_quotation_id_fkey"
      columns: ["quotation_id"]
isOneToOne: false
      referencedRelation: "v_quotation_turnaround"
      referencedColumns: ["quotation_id"]
    }
                  ]
                },"quotations": {
                  Row: {
                    "attachment_document_id": string | null,"commercial_compliance": boolean | null,"competitor": string | null,"created_at": string,"created_by": string | null,"currency": string,"delivery_terms": string | null,"discount_amount": number | null,"export_format": string | null,"final_price": number | null,"freight_amount": number | null,"gst_amount": number | null,"id": string,"internal_notes": string | null,"is_current": boolean,"l1_price": number | null,"lead_time_days": number | null,"line_item_id": string | null,"loss_reason": Database["public"]['Enums']["loss_reason"] | null,"oem_id": string | null,"oem_price": number | null,"oem_quotation_number": string | null,"payment_terms": string | null,"pnc_status": Database["public"]['Enums']["pnc_status"],"post_submission_status": Database["public"]['Enums']["post_submission_status"] | null,"quantity": number | null,"quotation_date": string | null,"quotation_number": string | null,"recommended_price": number | null,"requirement_id": string,"status": Database["public"]['Enums']["quotation_status"],"submitted_at": string | null,"target_margin_percentage": number | null,"technical_compliance": boolean | null,"unit_price": number | null,"updated_at": string,"validity_days": number | null,"version": number
                  }
                  Insert: {
                    "attachment_document_id"?: string | null,"commercial_compliance"?: boolean | null,"competitor"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"delivery_terms"?: string | null,"discount_amount"?: number | null,"export_format"?: string | null,"final_price"?: number | null,"freight_amount"?: number | null,"gst_amount"?: number | null,"id"?: string,"internal_notes"?: string | null,"is_current"?: boolean,"l1_price"?: number | null,"lead_time_days"?: number | null,"line_item_id"?: string | null,"loss_reason"?: Database["public"]['Enums']["loss_reason"] | null,"oem_id"?: string | null,"oem_price"?: number | null,"oem_quotation_number"?: string | null,"payment_terms"?: string | null,"pnc_status"?: Database["public"]['Enums']["pnc_status"],"post_submission_status"?: Database["public"]['Enums']["post_submission_status"] | null,"quantity"?: number | null,"quotation_date"?: string | null,"quotation_number"?: string | null,"recommended_price"?: number | null,"requirement_id": string,"status"?: Database["public"]['Enums']["quotation_status"],"submitted_at"?: string | null,"target_margin_percentage"?: number | null,"technical_compliance"?: boolean | null,"unit_price"?: number | null,"updated_at"?: string,"validity_days"?: number | null,"version"?: number
                  }
                  Update: {
                    "attachment_document_id"?: string | null,"commercial_compliance"?: boolean | null,"competitor"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"delivery_terms"?: string | null,"discount_amount"?: number | null,"export_format"?: string | null,"final_price"?: number | null,"freight_amount"?: number | null,"gst_amount"?: number | null,"id"?: string,"internal_notes"?: string | null,"is_current"?: boolean,"l1_price"?: number | null,"lead_time_days"?: number | null,"line_item_id"?: string | null,"loss_reason"?: Database["public"]['Enums']["loss_reason"] | null,"oem_id"?: string | null,"oem_price"?: number | null,"oem_quotation_number"?: string | null,"payment_terms"?: string | null,"pnc_status"?: Database["public"]['Enums']["pnc_status"],"post_submission_status"?: Database["public"]['Enums']["post_submission_status"] | null,"quantity"?: number | null,"quotation_date"?: string | null,"quotation_number"?: string | null,"recommended_price"?: number | null,"requirement_id"?: string,"status"?: Database["public"]['Enums']["quotation_status"],"submitted_at"?: string | null,"target_margin_percentage"?: number | null,"technical_compliance"?: boolean | null,"unit_price"?: number | null,"updated_at"?: string,"validity_days"?: number | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotations_attachment_document_id_fkey"
      columns: ["attachment_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_attachment_document_id_fkey"
      columns: ["attachment_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "quotations_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "quotations_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"requirements": {
                  Row: {
                    "assigned_employee_id": string | null,"bid_type": Database["public"]['Enums']["bid_type"],"created_at": string,"created_by": string | null,"customer_agency": string,"customer_division": string | null,"customer_id": string | null,"customer_sub_division": string | null,"gem_tender_number": string | null,"id": string,"primary_oem_id": string | null,"project_name": string,"pursue_decision": Database["public"]['Enums']["pursue_decision"],"quotation_validity_days": number | null,"regret_letter_logged": boolean,"remarks": string | null,"reminder_days_before": number,"rfi_number": string | null,"source": Database["public"]['Enums']["enquiry_source"],"special_remarks": Database["public"]['Enums']["approval_needed"],"staggered_delivery": boolean,"status": Database["public"]['Enums']["requirement_status"],"submission_deadline": string | null,"submission_type": Database["public"]['Enums']["submission_type"],"technical_specs": string | null,"updated_at": string
                  }
                  Insert: {
                    "assigned_employee_id"?: string | null,"bid_type"?: Database["public"]['Enums']["bid_type"],"created_at"?: string,"created_by"?: string | null,"customer_agency": string,"customer_division"?: string | null,"customer_id"?: string | null,"customer_sub_division"?: string | null,"gem_tender_number"?: string | null,"id"?: string,"primary_oem_id"?: string | null,"project_name": string,"pursue_decision"?: Database["public"]['Enums']["pursue_decision"],"quotation_validity_days"?: number | null,"regret_letter_logged"?: boolean,"remarks"?: string | null,"reminder_days_before"?: number,"rfi_number"?: string | null,"source"?: Database["public"]['Enums']["enquiry_source"],"special_remarks"?: Database["public"]['Enums']["approval_needed"],"staggered_delivery"?: boolean,"status"?: Database["public"]['Enums']["requirement_status"],"submission_deadline"?: string | null,"submission_type"?: Database["public"]['Enums']["submission_type"],"technical_specs"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "assigned_employee_id"?: string | null,"bid_type"?: Database["public"]['Enums']["bid_type"],"created_at"?: string,"created_by"?: string | null,"customer_agency"?: string,"customer_division"?: string | null,"customer_id"?: string | null,"customer_sub_division"?: string | null,"gem_tender_number"?: string | null,"id"?: string,"primary_oem_id"?: string | null,"project_name"?: string,"pursue_decision"?: Database["public"]['Enums']["pursue_decision"],"quotation_validity_days"?: number | null,"regret_letter_logged"?: boolean,"remarks"?: string | null,"reminder_days_before"?: number,"rfi_number"?: string | null,"source"?: Database["public"]['Enums']["enquiry_source"],"special_remarks"?: Database["public"]['Enums']["approval_needed"],"staggered_delivery"?: boolean,"status"?: Database["public"]['Enums']["requirement_status"],"submission_deadline"?: string | null,"submission_type"?: Database["public"]['Enums']["submission_type"],"technical_specs"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "requirements_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requirements_primary_oem_id_fkey"
      columns: ["primary_oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requirements_primary_oem_id_fkey"
      columns: ["primary_oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "requirements_primary_oem_id_fkey"
      columns: ["primary_oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "requirements_primary_oem_id_fkey"
      columns: ["primary_oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"sourcing_requests": {
                  Row: {
                    "channel": Database["public"]['Enums']["sourcing_channel"],"created_at": string,"created_by": string | null,"id": string,"line_item_id": string | null,"message": string | null,"oem_id": string,"requirement_id": string,"sent_at": string,"subject": string | null
                  }
                  Insert: {
                    "channel"?: Database["public"]['Enums']["sourcing_channel"],"created_at"?: string,"created_by"?: string | null,"id"?: string,"line_item_id"?: string | null,"message"?: string | null,"oem_id": string,"requirement_id": string,"sent_at"?: string,"subject"?: string | null
                  }
                  Update: {
                    "channel"?: Database["public"]['Enums']["sourcing_channel"],"created_at"?: string,"created_by"?: string | null,"id"?: string,"line_item_id"?: string | null,"message"?: string | null,"oem_id"?: string,"requirement_id"?: string,"sent_at"?: string,"subject"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sourcing_requests_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"sourcing_responses": {
                  Row: {
                    "attachment_document_id": string | null,"created_at": string,"created_by": string | null,"id": string,"lead_time_days": number | null,"quoted_unit_price": number | null,"received_at": string,"response_text": string | null,"response_type": Database["public"]['Enums']["sourcing_response_type"],"sourcing_request_id": string,"valid_until": string | null
                  }
                  Insert: {
                    "attachment_document_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lead_time_days"?: number | null,"quoted_unit_price"?: number | null,"received_at"?: string,"response_text"?: string | null,"response_type"?: Database["public"]['Enums']["sourcing_response_type"],"sourcing_request_id": string,"valid_until"?: string | null
                  }
                  Update: {
                    "attachment_document_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lead_time_days"?: number | null,"quoted_unit_price"?: number | null,"received_at"?: string,"response_text"?: string | null,"response_type"?: Database["public"]['Enums']["sourcing_response_type"],"sourcing_request_id"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sourcing_responses_attachment_document_fk"
      columns: ["attachment_document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_responses_attachment_document_fk"
      columns: ["attachment_document_id"]
isOneToOne: false
      referencedRelation: "v_document_register"
      referencedColumns: ["document_id"]
    },{
      foreignKeyName: "sourcing_responses_sourcing_request_id_fkey"
      columns: ["sourcing_request_id"]
isOneToOne: false
      referencedRelation: "sourcing_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_responses_sourcing_request_id_fkey"
      columns: ["sourcing_request_id"]
isOneToOne: false
      referencedRelation: "v_sourcing_ledger"
      referencedColumns: ["sourcing_request_id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"is_active": boolean,"role": Database["public"]['Enums']["user_role"],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"is_active"?: boolean,"role": Database["public"]['Enums']["user_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"is_active"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "v_client_repeat": {
                  Row: {
                    "client": string | null,"po_count": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_commission_receivable": {
                  Row: {
                    "base_invoice_amount": number | null,"commission_amount": number | null,"commission_invoice_id": string | null,"commission_invoice_number": string | null,"customer_name": string | null,"gst_amount": number | null,"invoice_date": string | null,"oem_name": string | null,"outstanding_amount": number | null,"payment_due_date": string | null,"payment_status": Database["public"]['Enums']["commission_status"] | null,"tds_amount": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_commission_recovery": {
                  Row: {
                    "commission_invoice_id": string | null,"oem_invoice_id": string | null,"oem_paid_on": string | null,"raised_on": string | null,"recovery_days": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "oem_invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_followup_tracker"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_invoice_balances"
      referencedColumns: ["oem_invoice_id"]
    },{
      foreignKeyName: "commission_invoices_oem_invoice_id_fkey"
      columns: ["oem_invoice_id"]
isOneToOne: false
      referencedRelation: "v_payment_collection"
      referencedColumns: ["oem_invoice_id"]
    }
                  ]
                },"v_commitment_detail": {
                  Row: {
                    "commitment_id": string | null,"created_at": string | null,"firm": boolean | null,"line_item_id": string | null,"notes": string | null,"oem_id": string | null,"oem_name": string | null,"part_number": string | null,"project_name": string | null,"quantity": number | null,"requirement_id": string | null,"source": string | null,"updated_at": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quantity_commitments_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quantity_commitments_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_dashboard_metrics": {
                  Row: {
                    "active_quotations": number | null,"commission_receivable": number | null,"documents_expiring": number | null,"lost_requirements": number | null,"open_pos": number | null,"overdue_invoices": number | null,"pending_deliveries": number | null,"pending_oem_invoices": number | null,"rfis_open": number | null,"submitted_requirements": number | null,"total_rfis": number | null,"won_requirements": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_delivery_adherence": {
                  Row: {
                    "committed_deadline": string | null,"delivery_date": string | null,"delivery_id": string | null,"oem_id": string | null,"on_time": boolean | null,"purchase_order_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"v_delivery_status": {
                  Row: {
                    "closure_status": Database["public"]['Enums']["delivery_closure"] | null,"delivery_date": string | null,"delivery_id": string | null,"delivery_reference": string | null,"delivery_status": Database["public"]['Enums']["delivery_status"] | null,"grn_number": string | null,"invoice_number": string | null,"material_acceptance_status": Database["public"]['Enums']["material_acceptance_status"] | null,"pending_balance": number | null,"purchase_order_id": string | null,"quantity_delivered": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    }
                  ]
                },"v_document_register": {
                  Row: {
                    "created_at": string | null,"days_to_expiry": number | null,"document_id": string | null,"document_type": Database["public"]['Enums']["document_type"] | null,"expiry_date": string | null,"file_name": string | null,"issue_date": string | null,"mime_type": string | null,"oem_id": string | null,"oem_name": string | null,"po_number": string | null,"project_name": string | null,"purchase_order_id": string | null,"renewal_reminder_days": number | null,"requirement_id": string | null,"size_bytes": number | null,"storage_bucket": string | null,"storage_path": string | null,"supplier": string | null,"title": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "documents_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "documents_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_employee_performance": {
                  Row: {
                    "closure_percentage": number | null,"full_name": string | null,"requirements": number | null,"user_id": string | null,"won": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_followup_tracker": {
                  Row: {
                    "balance_outstanding": number | null,"customer": string | null,"followup_status": string | null,"invoice_number": string | null,"oem_invoice_id": string | null,"overdue_days": number | null,"paid_amount": number | null,"payment_due_date": string | null,"status": Database["public"]['Enums']["invoice_status"] | null
                  }
                  Relationships: [
                    
                  ]
                },"v_invoice_balances": {
                  Row: {
                    "balance_outstanding": number | null,"commission_amount": number | null,"commission_invoice_id": string | null,"commission_invoice_number": string | null,"customer": string | null,"due_in_days": number | null,"gross_amount": number | null,"gst_amount": number | null,"invoice_date": string | null,"invoice_number": string | null,"is_full_invoice": boolean | null,"last_payment_date": string | null,"net_amount": number | null,"oem_id": string | null,"oem_invoice_id": string | null,"oem_name": string | null,"paid_amount": number | null,"payment_due_date": string | null,"po_number": string | null,"purchase_order_id": string | null,"quantity_invoiced": number | null,"status": Database["public"]['Enums']["invoice_status"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"v_line_item_coverage": {
                  Row: {
                    "client_part_number": string | null,"description": string | null,"firm_committed": number | null,"indicated_available": number | null,"line_item_id": string | null,"line_no": number | null,"oem_id": string | null,"part_number": string | null,"required_delivery_date": string | null,"required_quantity": number | null,"requirement_id": string | null,"uncovered_quantity": number | null,"uom": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "line_items_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_margin_report": {
                  Row: {
                    "final_price": number | null,"freight_amount": number | null,"margin_amount": number | null,"margin_percentage": number | null,"oem_price": number | null,"project_name": string | null,"quotation_id": string | null,"quotation_number": string | null
                  }
                  Relationships: [
                    
                  ]
                },"v_monthly_sales": {
                  Row: {
                    "month": string | null,"po_count": number | null,"total_value": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_oem_capacity": {
                  Row: {
                    "available_quantity": number | null,"capacity": number | null,"committed_quantity": number | null,"name": string | null,"oem_id": string | null
                  }
                  Relationships: [
                    
                  ]
                },"v_oem_certification_expiry": {
                  Row: {
                    "certification_id": string | null,"certification_type": string | null,"days_remaining": number | null,"expiry_date": string | null,"expiry_state": string | null,"issue_date": string | null,"issued_by": string | null,"oem_id": string | null,"oem_name": string | null,"reference_number": string | null,"reminder_days": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "oem_certifications_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    }
                  ]
                },"v_oem_directory": {
                  Row: {
                    "available_quantity": number | null,"brand_product_category": string | null,"capacity": number | null,"certification_count": number | null,"commission_percentage": number | null,"committed_quantity": number | null,"contact_count": number | null,"country_of_origin": string | null,"govt_vendor_list_source": string | null,"govt_vendor_list_status": Database["public"]['Enums']["oem_approval_status"] | null,"is_active": boolean | null,"lead_time_days": number | null,"name": string | null,"next_expiry_date": string | null,"oem_id": string | null
                  }
                  Relationships: [
                    
                  ]
                },"v_oem_performance": {
                  Row: {
                    "deliveries": number | null,"oem_id": string | null,"oem_name": string | null,"on_time_deliveries": number | null,"on_time_percentage": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_order_risk": {
                  Row: {
                    "batch_number": string | null,"committed_deadline": string | null,"customer_agency": string | null,"days_to_deadline": number | null,"expected_completion_date": string | null,"extension_note": string | null,"extension_requested_at": string | null,"invoiced_quantity": number | null,"latest_pdi_date": string | null,"latest_pdi_result": Database["public"]['Enums']["pdi_result"] | null,"oem_id": string | null,"oem_name": string | null,"po_number": string | null,"po_value": number | null,"production_status": Database["public"]['Enums']["material_status"] | null,"project_name": string | null,"purchase_order_id": string | null,"qc_status": Database["public"]['Enums']["material_status"] | null,"quantity_ordered": number | null,"rejected_quantity": number | null,"requirement_id": string | null,"serial_number": string | null,"status": Database["public"]['Enums']["po_status"] | null,"tentative_pdi_date": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "purchase_orders_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_past_bids": {
                  Row: {
                    "commercial_compliance": boolean | null,"competitor": string | null,"created_at": string | null,"customer_agency": string | null,"final_price": number | null,"l1_price": number | null,"line_item_id": string | null,"loss_reason": Database["public"]['Enums']["loss_reason"] | null,"oem_id": string | null,"oem_name": string | null,"oem_price": number | null,"part_number": string | null,"pnc_status": Database["public"]['Enums']["pnc_status"] | null,"post_submission_status": Database["public"]['Enums']["post_submission_status"] | null,"product_type": string | null,"project_name": string | null,"quotation_id": string | null,"requirement_id": string | null,"status": Database["public"]['Enums']["quotation_status"] | null,"submitted_at": string | null,"technical_compliance": boolean | null,"version": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotations_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "quotations_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_payment_collection": {
                  Row: {
                    "collection_days": number | null,"first_payment_date": string | null,"invoice_date": string | null,"oem_invoice_id": string | null,"purchase_order_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "oem_invoices_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    }
                  ]
                },"v_pdi_status": {
                  Row: {
                    "conducted_date": string | null,"customer": string | null,"dispatch_clearance": Database["public"]['Enums']["dispatch_clearance"] | null,"inspection_agency": Database["public"]['Enums']["inspection_agency"] | null,"inspection_type": Database["public"]['Enums']["pdi_mode"] | null,"inspector_details": string | null,"line_item_id": string | null,"oem_name": string | null,"part_number": string | null,"pdi_id": string | null,"pdi_number": string | null,"po_number": string | null,"purchase_order_id": string | null,"quantity_cleared": number | null,"quantity_offered": number | null,"quantity_rejected": number | null,"re_pdi_required": boolean | null,"result": Database["public"]['Enums']["pdi_result"] | null,"scheduled_date": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pdis_line_item_id_fkey"
      columns: ["line_item_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_line_item_id_fkey"
      columns: ["line_item_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "purchase_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_order_risk"
      referencedColumns: ["purchase_order_id"]
    },{
      foreignKeyName: "pdis_purchase_order_id_fkey"
      columns: ["purchase_order_id"]
isOneToOne: false
      referencedRelation: "v_po_tracking"
      referencedColumns: ["purchase_order_id"]
    }
                  ]
                },"v_pending_quotations": {
                  Row: {
                    "age_days": number | null,"customer_agency": string | null,"final_price": number | null,"project_name": string | null,"quotation_id": string | null,"quotation_number": string | null,"raised_on": string | null,"status": Database["public"]['Enums']["quotation_status"] | null
                  }
                  Relationships: [
                    
                  ]
                },"v_po_tracking": {
                  Row: {
                    "balance_quantity": number | null,"committed_deadline": string | null,"customer": string | null,"delivered_quantity": number | null,"invoiced_quantity": number | null,"oem_name": string | null,"po_number": string | null,"po_value": number | null,"purchase_order_id": string | null,"quantity_ordered": number | null,"status": Database["public"]['Enums']["po_status"] | null
                  }
                  Relationships: [
                    
                  ]
                },"v_product_sales": {
                  Row: {
                    "oem_name": string | null,"part_number": string | null,"po_count": number | null,"total_value": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_profitability": {
                  Row: {
                    "commission_earned": number | null,"customer_agency": string | null,"project_name": string | null,"requirement_id": string | null,"revenue": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_quotation_approvals": {
                  Row: {
                    "fully_approved": boolean | null,"group_head_approved": number | null,"management_approved": number | null,"quotation_id": string | null
                  }
                  Relationships: [
                    
                  ]
                },"v_quotation_turnaround": {
                  Row: {
                    "created_at": string | null,"quotation_id": string | null,"requirement_id": string | null,"submitted_at": string | null,"turnaround_days": number | null
                  }
                  Insert: {
                           "created_at"?: string | null,"quotation_id"?: string | null,"requirement_id"?: string | null,"submitted_at"?: string | null,"turnaround_days"?: never
                         }
                        Update: {
                           "created_at"?: string | null,"quotation_id"?: string | null,"requirement_id"?: string | null,"submitted_at"?: string | null,"turnaround_days"?: never
                         }
                        Relationships: [
                    {
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "quotations_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_requirement_coverage": {
                  Row: {
                    "assigned_employee_id": string | null,"customer_agency": string | null,"firm_committed": number | null,"indicated_available": number | null,"project_name": string | null,"pursue_decision": Database["public"]['Enums']["pursue_decision"] | null,"quotation_validity_days": number | null,"required_quantity": number | null,"requirement_id": string | null,"rfi_number": string | null,"staggered_delivery": boolean | null,"status": Database["public"]['Enums']["requirement_status"] | null,"submission_deadline": string | null,"uncovered_quantity": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_revenue_by_client": {
                  Row: {
                    "client": string | null,"po_count": number | null,"total_value": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_revenue_by_oem": {
                  Row: {
                    "oem_name": string | null,"po_count": number | null,"total_value": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_sourcing_ledger": {
                  Row: {
                    "channel": Database["public"]['Enums']["sourcing_channel"] | null,"latest_quoted_unit_price": number | null,"latest_response_at": string | null,"latest_response_type": Database["public"]['Enums']["sourcing_response_type"] | null,"line_item_id": string | null,"message": string | null,"oem_id": string | null,"oem_name": string | null,"part_number": string | null,"project_name": string | null,"requirement_id": string | null,"response_count": number | null,"sent_at": string | null,"sourcing_request_id": string | null,"subject": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sourcing_requests_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "line_items"
      referencedColumns: ["id","requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_line_item_id_requirement_id_fkey"
      columns: ["line_item_id","requirement_id"]
isOneToOne: false
      referencedRelation: "v_line_item_coverage"
      referencedColumns: ["line_item_id","requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "oems"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_capacity"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_directory"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_oem_id_fkey"
      columns: ["oem_id"]
isOneToOne: false
      referencedRelation: "v_oem_performance"
      referencedColumns: ["oem_id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "requirements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_profitability"
      referencedColumns: ["requirement_id"]
    },{
      foreignKeyName: "sourcing_requests_requirement_id_fkey"
      columns: ["requirement_id"]
isOneToOne: false
      referencedRelation: "v_requirement_coverage"
      referencedColumns: ["requirement_id"]
    }
                  ]
                },"v_tax_summary": {
                  Row: {
                    "gst_on_commission": number | null,"gst_on_invoices": number | null,"month": string | null,"tds_deducted": number | null
                  }
                  Relationships: [
                    
                  ]
                },"v_yearly_sales": {
                  Row: {
                    "po_count": number | null,"total_value": number | null,"year": string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "auth_is_privileged":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"has_two_level_approval":
{ Args: { "p_entity_id": string,"p_entity_type": string,"p_stage": Database["public"]['Enums']["approval_stage"] }; Returns: boolean
                           },
"record_approval":
{ Args: { "p_decision": Database["public"]['Enums']["approval_decision"],"p_entity_id": string,"p_entity_type": string,"p_level": Database["public"]['Enums']["approval_level"],"p_note"?: string,"p_stage": Database["public"]['Enums']["approval_stage"] }; Returns: {
              "actor_id": string | null,
"created_at": string,
"decided_at": string | null,
"decision": Database["public"]['Enums']["approval_decision"],
"entity_id": string,
"entity_type": string,
"id": string,
"level": Database["public"]['Enums']["approval_level"],
"note": string | null,
"stage": Database["public"]['Enums']["approval_stage"]
            }
                          SetofOptions: {
        from: "*"
        to: "approvals"
        isOneToOne: true
        isSetofReturn: false
      } },
"role_can_read":
{ Args: { "p_area": string }; Returns: boolean
                           },
"role_can_write":
{ Args: { "p_area": string }; Returns: boolean
                           },
"schema_overview":
{ Args: Record<PropertyKey, never>; Returns: {
              "row_count": number,"table_name": string
            }[]
                           }
          }
          Enums: {
            "approval_decision": "pending"|"approved"|"rejected","approval_level": "group_head"|"management","approval_needed": "rcma"|"cemilac"|"lcso"|"mil"|"none","approval_stage": "rfi_qualified"|"quotation_submitted"|"oem_selected"|"order_accepted"|"document_approved","audit_action": "insert"|"update"|"delete","bid_type": "single"|"double","commission_status": "draft"|"raised"|"submitted"|"partially_paid"|"paid"|"overdue","delivery_closure": "pending"|"closed","delivery_status": "in_transit"|"delivered"|"partially_delivered"|"cancelled","dispatch_clearance": "pending"|"approved"|"hold","document_type": "rcma"|"cemilac"|"dgqa"|"lcso"|"mil"|"test_certificate"|"delivery_challan"|"lr_copy"|"payment_proof"|"po_copy"|"invoice_copy"|"pdi_report"|"regret_letter"|"tender_document"|"technical_specification"|"drawing"|"proof_of_delivery"|"other"|"rfq"|"quotation"|"commission_invoice","enquiry_source": "email"|"gem_portal"|"client_portal"|"direct_customer"|"through_oem","followup_status": "none"|"reminded"|"escalated"|"resolved","inspection_agency": "dgqa"|"client_agency"|"internal"|"third_party","invoice_status": "raised"|"submitted"|"approved"|"paid"|"cancelled","loss_reason": "price"|"technical_non_compliance"|"delivery_timeline"|"competitor_preference"|"quantity_or_capacity"|"cancelled"|"not_pursued"|"other","material_acceptance_status": "pending"|"accepted"|"partially_accepted"|"rejected","material_status": "not_started"|"in_production"|"ready"|"qc_pending"|"qc_passed"|"qc_failed","oem_approval_status": "approved"|"not_approved"|"pending"|"unknown","payment_mode": "rtgs"|"neft"|"wire"|"other","payment_status": "pending"|"partially_paid"|"paid"|"overdue","pdi_mode": "vc"|"physical","pdi_result": "pending"|"cleared"|"partially_cleared"|"rejected","pnc_status": "not_applicable"|"pending"|"in_progress"|"completed","po_status": "open"|"processing"|"completed"|"cancelled","post_submission_status": "submitted"|"clarification_requested"|"technical_clarification"|"commercial_negotiation"|"awaiting_approval"|"won"|"lost"|"cancelled","pursue_decision": "undecided"|"pursued"|"not_pursued","quotation_status": "draft"|"pending_group_head"|"pending_management"|"approved"|"submitted"|"clarification_requested"|"technical_clarification"|"commercial_negotiation"|"awaiting_approval"|"won"|"lost"|"cancelled","requirement_status": "received"|"qualifying"|"quoted"|"submitted"|"won"|"lost"|"cancelled","sourcing_channel": "email"|"whatsapp"|"phone"|"portal"|"other","sourcing_response_type": "no_response"|"price_indication"|"availability"|"firm_quote"|"decline","submission_type": "hard_copy"|"soft_copy"|"both","user_role": "owner"|"group_head"|"management"|"sales"|"operations"|"finance"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "approval_decision": ["pending", "approved", "rejected"],"approval_level": ["group_head", "management"],"approval_needed": ["rcma", "cemilac", "lcso", "mil", "none"],"approval_stage": ["rfi_qualified", "quotation_submitted", "oem_selected", "order_accepted", "document_approved"],"audit_action": ["insert", "update", "delete"],"bid_type": ["single", "double"],"commission_status": ["draft", "raised", "submitted", "partially_paid", "paid", "overdue"],"delivery_closure": ["pending", "closed"],"delivery_status": ["in_transit", "delivered", "partially_delivered", "cancelled"],"dispatch_clearance": ["pending", "approved", "hold"],"document_type": ["rcma", "cemilac", "dgqa", "lcso", "mil", "test_certificate", "delivery_challan", "lr_copy", "payment_proof", "po_copy", "invoice_copy", "pdi_report", "regret_letter", "tender_document", "technical_specification", "drawing", "proof_of_delivery", "other", "rfq", "quotation", "commission_invoice"],"enquiry_source": ["email", "gem_portal", "client_portal", "direct_customer", "through_oem"],"followup_status": ["none", "reminded", "escalated", "resolved"],"inspection_agency": ["dgqa", "client_agency", "internal", "third_party"],"invoice_status": ["raised", "submitted", "approved", "paid", "cancelled"],"loss_reason": ["price", "technical_non_compliance", "delivery_timeline", "competitor_preference", "quantity_or_capacity", "cancelled", "not_pursued", "other"],"material_acceptance_status": ["pending", "accepted", "partially_accepted", "rejected"],"material_status": ["not_started", "in_production", "ready", "qc_pending", "qc_passed", "qc_failed"],"oem_approval_status": ["approved", "not_approved", "pending", "unknown"],"payment_mode": ["rtgs", "neft", "wire", "other"],"payment_status": ["pending", "partially_paid", "paid", "overdue"],"pdi_mode": ["vc", "physical"],"pdi_result": ["pending", "cleared", "partially_cleared", "rejected"],"pnc_status": ["not_applicable", "pending", "in_progress", "completed"],"po_status": ["open", "processing", "completed", "cancelled"],"post_submission_status": ["submitted", "clarification_requested", "technical_clarification", "commercial_negotiation", "awaiting_approval", "won", "lost", "cancelled"],"pursue_decision": ["undecided", "pursued", "not_pursued"],"quotation_status": ["draft", "pending_group_head", "pending_management", "approved", "submitted", "clarification_requested", "technical_clarification", "commercial_negotiation", "awaiting_approval", "won", "lost", "cancelled"],"requirement_status": ["received", "qualifying", "quoted", "submitted", "won", "lost", "cancelled"],"sourcing_channel": ["email", "whatsapp", "phone", "portal", "other"],"sourcing_response_type": ["no_response", "price_indication", "availability", "firm_quote", "decline"],"submission_type": ["hard_copy", "soft_copy", "both"],"user_role": ["owner", "group_head", "management", "sales", "operations", "finance"]
          }
        }
} as const

