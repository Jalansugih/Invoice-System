import React, { useMemo, useState } from 'react';
import { FileText, Plus, Search, Eye, Printer, Download, Truck, ClipboardCheck, ShoppingCart, FileCheck2, X, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StorageService, generateId } from '../../lib/storage';
import { BusinessDocument, BusinessDocumentItem, BusinessDocumentType, Customer, Product } from '../../types';
import { formatDocNumber } from '../../lib/utils';
import { exportElementToPdf } from '../../lib/pdfExport';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';

const TYPES: Array<{ value: BusinessDocumentType; label: string; icon: React.ElementType; prefix: string }> = [
  { value: 'quotation', label: 'Quotation / Penawaran', icon: FileCheck2, prefix: 'QUO' },
  { value: 'purchase_order', label: 'PO Customer', icon: ShoppingCart, prefix: 'PO' },
  { value: 'sales_order', label: 'Sales Order', icon: FileText, prefix: 'SO' },
  { value: 'delivery_order', label: 'Surat Jalan', icon: Truck, prefix: 'SJ' },
  { value: 'bast', label: 'BAST / Serah Terima', icon: ClipboardCheck, prefix: 'BAST' },
];
const statusLabels: Record<BusinessDocument['status'], string> = { draft:'Draft', sent:'Dikirim', approved:'Disetujui', rejected:'Ditolak', confirmed:'Dikonfirmasi', shipped:'Dikirim', delivered:'Diterima', completed:'Selesai', cancelled:'Dibatalkan' };
const rupiah=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value||0);
const today=()=>new Date().toISOString().slice(0,10);
const getSequenceKey=(type:BusinessDocumentType)=>type==='purchase_order'?'purchaseOrder':type==='delivery_order'?'deliveryOrder':type==='sales_order'?'salesOrder':type;
const nextType: Record<BusinessDocumentType, BusinessDocumentType|undefined> = { quotation:'purchase_order', purchase_order:'delivery_order', sales_order:'delivery_order', delivery_order:'bast', bast:undefined };
const nextLabel: Record<BusinessDocumentType,string> = { quotation:'PO', purchase_order:'Surat Jalan', sales_order:'Surat Jalan', delivery_order:'BAST', bast:'Invoice' };

export const BusinessDocumentsView: React.FC = () => {
  const [documents,setDocuments]=useState(StorageService.getBusinessDocuments());
  const [customers]=useState<Customer[]>(StorageService.getCustomers());
  const [products]=useState<Product[]>(StorageService.getProducts().filter(p=>p.isActive));
  const [typeFilter,setTypeFilter]=useState<BusinessDocumentType|'all'>('all');
  const [query,setQuery]=useState('');
  const [showForm,setShowForm]=useState(false);
  const [preview,setPreview]=useState<BusinessDocument|null>(null);
  const [editing,setEditing]=useState<BusinessDocument|null>(null);
  const [saving,setSaving]=useState(false);
  const [timelineRoot,setTimelineRoot]=useState<BusinessDocument|null>(null);
  const [invoiceSource,setInvoiceSource]=useState<BusinessDocument|null>(null);
  const [invoiceQuantities,setInvoiceQuantities]=useState<Record<string,number>>({});
  const [form,setForm]=useState(()=>makeBlankForm('quotation'));
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return documents.filter(d=>(typeFilter==='all'||d.documentType===typeFilter)&&(!q||[d.documentNumber,d.title,d.customerName,d.referenceNumber].some(v=>(v||'').toLowerCase().includes(q))))},[documents,typeFilter,query]);

  const openCreate=(type:BusinessDocumentType='quotation', source?:BusinessDocument)=>{setEditing(null);setForm(makeBlankForm(type, source, customers));setShowForm(true)};
  const openEdit=(doc:BusinessDocument)=>{setEditing(doc);setForm({type:doc.documentType,customerId:doc.customerId||'',date:doc.date,validUntil:doc.validUntil||'',referenceNumber:doc.referenceNumber||'',parentDocumentId:doc.parentDocumentId||'',deliveryAddress:doc.deliveryAddress||'',notes:doc.notes||'',status:doc.status,items:doc.items.length?doc.items:[blankItem()]});setShowForm(true)};

  const updateCustomer=(customerId:string)=>{
    const customer=customers.find(c=>c.id===customerId);
    setForm(prev=>({...prev,customerId,deliveryAddress:prev.deliveryAddress || customer?.address || ''}));
  };

  const addProductItem=(productId:string,index:number)=>{
    const product=products.find(p=>p.id===productId);
    if(!product)return;
    updateItem(setForm,form,index,{productId:product.id,description:product.name||product.description,unit:product.unit||'Unit',unitPrice:product.price||0,taxRate:product.taxRate||0});
  };

  const save=async()=>{
    if(!form.customerId){alert('Pilih customer terlebih dahulu.');return;}
    const validItems=form.items.filter(i=>i.description.trim() && i.quantity>0);
    if(!validItems.length){alert('Tambahkan minimal satu item.');return;}
    setSaving(true);
    try{
      const customer=customers.find(c=>c.id===form.customerId);
      const subtotal=validItems.reduce((s,i)=>s+Math.max(0,i.quantity*i.unitPrice-i.discount),0);
      const tax=validItems.reduce((s,i)=>s+Math.max(0,i.quantity*i.unitPrice-i.discount)*(i.taxRate/100),0);
      const total=subtotal+tax;
      let doc:BusinessDocument;
      if(editing){
        doc={...editing,title:`${TYPES.find(t=>t.value===form.type)?.label} - ${customer?.companyName||customer?.name||'Dokumen'}`,customerId:form.customerId,customerName:customer?.companyName||customer?.name||'',date:form.date,validUntil:form.validUntil||undefined,referenceNumber:form.referenceNumber||undefined,parentDocumentId:form.parentDocumentId||undefined,deliveryAddress:form.deliveryAddress||undefined,notes:form.notes||undefined,status:editing.status,items:validItems,subtotal,taxAmount:tax,grandTotal:total,updatedAt:new Date().toISOString()};
        StorageService.updateBusinessDocument(doc);
      }else{
        const seq=StorageService.nextBusinessDocumentSequence(getSequenceKey(form.type));
        const prefix=TYPES.find(t=>t.value===form.type)?.prefix||'DOC';
        const number=formatDocNumber(`${prefix}/{YEAR}/{MONTH}/{NUMBER}`,seq,new Date(`${form.date}T00:00:00`));
        const now=new Date().toISOString();
        doc={id:generateId(),documentType:form.type,documentNumber:number,title:`${TYPES.find(t=>t.value===form.type)?.label} - ${customer?.companyName||customer?.name||'Dokumen'}`,customerId:form.customerId,customerName:customer?.companyName||customer?.name||'',date:form.date,validUntil:form.validUntil||undefined,referenceNumber:form.referenceNumber||undefined,parentDocumentId:form.parentDocumentId||undefined,deliveryAddress:form.deliveryAddress||undefined,notes:form.notes||undefined,status:'draft',items:validItems,subtotal,taxAmount:tax,grandTotal:total,createdAt:now,updatedAt:now};
        StorageService.addBusinessDocument(doc);
      }
      setDocuments(StorageService.getBusinessDocuments());setShowForm(false);
    }finally{setSaving(false)}
  };

  const remainingItems=(source:BusinessDocument, childType:BusinessDocumentType)=>{
    const children=documents.filter(d=>d.parentDocumentId===source.id && d.documentType===childType);
    return source.items.map(it=>{
      const used=children.reduce((sum,d)=>sum+(d.items.find(x=>(x.productId&&it.productId&&x.productId===it.productId)||x.description===it.description)?.quantity||0),0);
      return {...it,quantity:Math.max(0,it.quantity-used)};
    }).filter(it=>it.quantity>0);
  };

  const convertToDocument=async(source:BusinessDocument,targetType:BusinessDocumentType)=>{
    if(nextType[source.documentType]!==targetType)return;
    const customer=customers.find(c=>c.id===source.customerId);
    if(!customer){alert('Customer pada dokumen sumber tidak ditemukan.');return;}

    if(targetType==='delivery_order' || targetType==='bast'){
      const remaining=remainingItems(source,targetType);
      if(!remaining.length){
        alert(`Semua quantity dari ${source.documentNumber} sudah ${targetType==='delivery_order'?'dikirim':'dibuat BAST'}.`);
        return;
      }
      openCreate(targetType,{...source,items:remaining});
      return;
    }

    const existing=documents.find(d=>d.parentDocumentId===source.id&&d.documentType===targetType);
    if(existing){setPreview(existing);return;}
    const seq=StorageService.nextBusinessDocumentSequence(getSequenceKey(targetType));
    const prefix=TYPES.find(t=>t.value===targetType)?.prefix||'DOC';
    const date=today(); const number=formatDocNumber(`${prefix}/{YEAR}/{MONTH}/{NUMBER}`,seq,new Date(`${date}T00:00:00`)); const now=new Date().toISOString();
    const items=source.items.map(it=>({...it,id:generateId()}));
    const subtotal=items.reduce((s,i)=>s+Math.max(0,i.quantity*i.unitPrice-i.discount),0); const tax=items.reduce((s,i)=>s+Math.max(0,i.quantity*i.unitPrice-i.discount)*(i.taxRate/100),0);
    const doc:BusinessDocument={id:generateId(),documentType:targetType,documentNumber:number,title:`${TYPES.find(t=>t.value===targetType)?.label} - ${customer.companyName||customer.name}`,customerId:source.customerId,customerName:customer.companyName||customer.name,date,referenceNumber:source.documentNumber,parentDocumentId:source.id,deliveryAddress:source.deliveryAddress||customer.address,notes:source.notes,status:'draft',items,subtotal,taxAmount:tax,grandTotal:subtotal+tax,createdAt:now,updatedAt:now};
    StorageService.addBusinessDocument(doc);setDocuments(StorageService.getBusinessDocuments());setPreview(doc);
  };

  const getInvoiceProgress=(source:BusinessDocument)=>{
    const invoices=StorageService.getInvoices().filter(inv=>inv.referenceNumber===source.documentNumber || inv.poNumber===source.documentNumber);
    return source.items.map(it=>{
      const used=invoices.reduce((sum,inv)=>sum+(inv.items.find(x=>(x.productId&&it.productId&&x.productId===it.productId)||x.description===it.description)?.quantity||0),0);
      return {...it,quantity:Math.max(0,it.quantity-used)};
    }).filter(it=>it.quantity>0);
  };

  const openInvoiceFromDocument=(source:BusinessDocument)=>{
    if(!source.customerId){alert('Customer pada dokumen sumber tidak ditemukan.');return;}
    const remaining=getInvoiceProgress(source);
    if(!remaining.length){alert(`Semua quantity ${source.documentNumber} sudah ditagihkan.`);return;}
    setInvoiceQuantities(Object.fromEntries(remaining.map(i=>[i.id,i.quantity])));
    setInvoiceSource(source);
  };

  const createInvoiceFromDocument=async(source:BusinessDocument, selectedItems?:BusinessDocumentItem[])=>{
    const invoiceItemsSource=selectedItems?.length?selectedItems:getInvoiceProgress(source);
    if(!invoiceItemsSource.length){alert(`Semua quantity ${source.documentNumber} sudah ditagihkan.`);return;}
    try{
      const org=StorageService.getOrganization();
      const invoiceItems=invoiceItemsSource.map(it=>({id:generateId(),productId:it.productId,description:it.description,quantity:it.quantity,unit:it.unit,unitPrice:it.unitPrice,discount:it.discount,taxRate:it.taxRate,amount:Math.max(0,it.quantity*it.unitPrice-it.discount)}));
      const due=new Date(`${today()}T00:00:00`); due.setDate(due.getDate()+(org.defaultPaymentTermsDays||30));
      const invoice=await StorageService.saveInvoice({customerId:source.customerId!,issueDate:today(),dueDate:due.toISOString().slice(0,10),referenceNumber:source.documentNumber,poNumber:source.documentType==='purchase_order'?source.documentNumber:undefined,notes:source.notes||'',paymentTerms:`Net ${org.defaultPaymentTermsDays||30} hari`,items:invoiceItems,discountType:'fixed',discountValue:0,additionalCharges:0,taxRate:source.taxAmount>0?11:0});
      setInvoiceSource(null);setPreview(null);alert(`Invoice ${invoice.invoiceNumber} berhasil dibuat dari ${source.documentNumber}.`);
    }catch(err:any){alert(err.message||'Gagal membuat invoice');}
  };

  const getChain=(root:BusinessDocument)=>{
    const chain: Array<{kind:string;number:string;date:string;status:string;amount:number;id:string}> = [];
    const visited=new Set<string>();
    let current:BusinessDocument|undefined=root;
    while(current && !visited.has(current.id)){
      visited.add(current.id);
      chain.unshift({kind:TYPES.find(t=>t.value===current!.documentType)?.label||current!.documentType,number:current.documentNumber,date:current.date,status:statusLabels[current.status],amount:current.grandTotal,id:current.id});
      current=documents.find(d=>d.id===current!.parentDocumentId);
    }
    const descendants=documents.filter(d=>d.customerId===root.customerId);
    const addChildren=(parentId:string)=>{
      descendants.filter(d=>d.parentDocumentId===parentId).forEach(d=>{
        if(visited.has(d.id))return;
        visited.add(d.id);
        chain.push({kind:TYPES.find(t=>t.value===d.documentType)?.label||d.documentType,number:d.documentNumber,date:d.date,status:statusLabels[d.status],amount:d.grandTotal,id:d.id});
        addChildren(d.id);
      });
    };
    addChildren(root.id);
    return chain;
  };

  const createNext=(doc:BusinessDocument)=>{const target=nextType[doc.documentType];if(!target)return; if(target==='delivery_order')convertToDocument(doc,target); else convertToDocument(doc,target);};

  return <div className="space-y-6 pb-12">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Dokumen Transaksi</h2><p className="text-xs text-slate-500 mt-1">Buat sekali, lalu lanjutkan ke dokumen berikutnya tanpa input ulang.</p></div><Button onClick={()=>openCreate('quotation')}><Plus className="w-4 h-4"/> Buat Quotation</Button></div>
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"><div className="flex items-start gap-3"><ArrowRight className="w-5 h-5 text-blue-600 mt-0.5"/><div><p className="text-sm font-bold text-blue-900">Alur cepat</p><p className="text-xs text-blue-800 mt-1">Quotation → PO → Surat Jalan → BAST → Invoice. Customer dan item terbawa otomatis.</p></div></div></div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{TYPES.map(t=>{const Icon=t.icon;const count=documents.filter(d=>d.documentType===t.value).length;return <button key={t.value} onClick={()=>setTypeFilter(t.value)} className={`text-left rounded-xl border p-4 bg-white hover:border-blue-300 transition ${typeFilter===t.value?'border-blue-500 ring-2 ring-blue-50':'border-slate-200'}`}><Icon className="w-4 h-4 text-blue-600"/><p className="text-[11px] font-bold text-slate-500 mt-3">{t.label}</p><p className="text-xl font-bold text-slate-900">{count}</p></button>})}</div>
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row gap-3"><Input placeholder="Cari nomor, customer, referensi..." value={query} onChange={e=>setQuery(e.target.value)} leftIcon={<Search className="w-4 h-4"/>}/><Select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as BusinessDocumentType|'all')} options={[{value:'all',label:'Semua dokumen'},...TYPES.map(t=>({value:t.value,label:t.label}))]}/></div>
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">Dokumen</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Tanggal</th><th className="text-right p-3">Total</th><th className="text-center p-3">Status</th><th className="text-right p-3">Aksi</th></tr></thead><tbody>{filtered.map(d=><tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/50"><td className="p-3"><div className="font-mono text-xs font-bold">{d.documentNumber}</div><div className="text-[11px] text-slate-500">{TYPES.find(t=>t.value===d.documentType)?.label}{d.referenceNumber&&` • ref ${d.referenceNumber}`}</div></td><td className="p-3 font-medium">{d.customerName||'-'}</td><td className="p-3 text-xs text-slate-500">{d.date}</td><td className="p-3 text-right font-semibold">{rupiah(d.grandTotal)}</td><td className="p-3 text-center"><span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-[10px] font-bold">{statusLabels[d.status]}</span></td><td className="p-3"><div className="flex justify-end gap-1">{nextType[d.documentType]&&<Button variant="secondary" onClick={()=>createNext(d)}><ArrowRight className="w-3.5 h-3.5"/> {nextLabel[d.documentType]}</Button>}{d.documentType==='bast'&&<Button onClick={()=>openInvoiceFromDocument(d)}>Invoice</Button>}<button onClick={()=>setTimelineRoot(d)} className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="Lihat alur transaksi"><ArrowRight className="w-4 h-4"/></button><button onClick={()=>setPreview(d)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Lihat"><Eye className="w-4 h-4"/></button><button onClick={()=>openEdit(d)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Edit"><ChevronRight className="w-4 h-4"/></button></div></td></tr>)}</tbody></table></div>{!filtered.length&&<div className="p-10 text-center text-sm text-slate-500">Belum ada dokumen yang sesuai.</div>}</div>

    <Modal isOpen={showForm} onClose={()=>setShowForm(false)} title={editing?`Edit ${TYPES.find(t=>t.value===form.type)?.label}`:`Buat ${TYPES.find(t=>t.value===form.type)?.label}`}>
      <div className="space-y-4">
        {!editing&&<div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">Nomor, status <strong>Draft</strong>, dan hubungan dokumen akan dibuat otomatis.</div>}
        <Select label="Customer" value={form.customerId} onChange={e=>updateCustomer(e.target.value)} options={[{value:'',label:'Pilih customer'},...customers.map(c=>({value:c.id,label:c.companyName||c.name}))]}/>
        {form.customerId&&<CustomerSummary customer={customers.find(c=>c.id===form.customerId)} />}
        <div className="grid grid-cols-2 gap-3"><Input label="Tanggal" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>{form.type==='quotation'&&<Input label="Berlaku sampai" type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})}/>}</div>
        {(form.type==='purchase_order'||form.type==='sales_order')&&<Input label="Nomor referensi / PO" value={form.referenceNumber} onChange={e=>setForm({...form,referenceNumber:e.target.value})} placeholder="Opsional"/>}
        {(form.type==='delivery_order'||form.type==='bast')&&<Input label="Alamat pengiriman / serah terima" value={form.deliveryAddress} onChange={e=>setForm({...form,deliveryAddress:e.target.value})}/>} 
        <div className="border border-slate-200 rounded-xl overflow-hidden"><div className="bg-slate-50 px-3 py-2 flex justify-between items-center"><span className="text-xs font-bold">Item</span><button className="text-xs text-blue-600 font-semibold" onClick={()=>setForm({...form,items:[...form.items,blankItem()]})}>+ Tambah item</button></div>{form.items.map((it,i)=><div key={it.id} className="p-3 border-t border-slate-100 space-y-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-2"><Select label="Produk" value={it.productId||''} onChange={e=>addProductItem(e.target.value,i)} options={[{value:'',label:'Pilih produk / isi manual'},...products.map(p=>({value:p.id,label:`${p.code} — ${p.name}`}))]}/><Input label="Deskripsi" placeholder="Deskripsi" value={it.description} onChange={e=>updateItem(setForm,form,i,{description:e.target.value})}/><Input label="Satuan" placeholder="Satuan" value={it.unit} onChange={e=>updateItem(setForm,form,i,{unit:e.target.value})}/><Input label="Qty" type="number" min="0" placeholder="Qty" value={it.quantity} onChange={e=>updateItem(setForm,form,i,{quantity:Number(e.target.value)})}/><Input label="Harga" type="number" min="0" placeholder="Harga" value={it.unitPrice} onChange={e=>updateItem(setForm,form,i,{unitPrice:Number(e.target.value)})}/><Input label="Diskon" type="number" min="0" placeholder="Diskon" value={it.discount} onChange={e=>updateItem(setForm,form,i,{discount:Number(e.target.value)})}/><Input label="Pajak %" type="number" min="0" placeholder="Pajak %" value={it.taxRate} onChange={e=>updateItem(setForm,form,i,{taxRate:Number(e.target.value)})}/></div><div className="text-right text-xs font-semibold text-slate-600">Total item: {rupiah(Math.max(0,it.quantity*it.unitPrice-it.discount))}</div>{form.items.length>1&&<button className="text-[11px] text-rose-600" onClick={()=>setForm({...form,items:form.items.filter((_,idx)=>idx!==i)})}>Hapus item</button>}</div>)}</div>
        <textarea className="w-full min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Catatan / syarat & ketentuan (opsional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <div className="flex justify-between items-center pt-2"><span className="text-xs text-slate-500">Data yang sudah dipilih akan dipakai lagi di dokumen berikutnya.</span><div className="flex gap-2"><Button variant="secondary" onClick={()=>setShowForm(false)}>Batal</Button><Button onClick={save} disabled={saving}>{saving?'Menyimpan...':'Simpan Dokumen'}</Button></div></div>
      </div>
    </Modal>


    {invoiceSource&&<InvoiceQuantityModal source={invoiceSource} quantities={invoiceQuantities} onChange={(id,qty)=>setInvoiceQuantities(prev=>({...prev,[id]:qty}))} onClose={()=>setInvoiceSource(null)} onCreate={()=>{const remaining=getInvoiceProgress(invoiceSource);const selected=remaining.map(i=>({...i,quantity:Math.min(i.quantity,Math.max(0,Number(invoiceQuantities[i.id]||0)))})).filter(i=>i.quantity>0);if(!selected.length){alert('Masukkan minimal satu quantity untuk ditagihkan.');return;}createInvoiceFromDocument(invoiceSource,selected);}}/>}

    {timelineRoot&&<TransactionTimeline root={timelineRoot} chain={getChain(timelineRoot)} onClose={()=>setTimelineRoot(null)} onOpen={(id)=>{const d=documents.find(x=>x.id===id);if(d){setTimelineRoot(null);setPreview(d)}}}/>}
    {preview&&<DocumentPreview doc={preview} onClose={()=>setPreview(null)} onEdit={()=>{setPreview(null);openEdit(preview)}} onNext={()=>createNext(preview)} onInvoice={()=>openInvoiceFromDocument(preview)}/>}</div>;
};

const CustomerSummary:React.FC<{customer?:Customer}>=({customer})=>customer?<div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-xs"><div className="flex items-center gap-2 font-bold text-emerald-800"><CheckCircle2 className="w-4 h-4"/> Data customer otomatis</div><div className="grid sm:grid-cols-2 gap-1 mt-2 text-emerald-900"><span>{customer.companyName||customer.name}</span><span>{customer.pic||'-'}</span><span>{customer.phone||'-'}</span><span>{customer.email||'-'}</span><span className="sm:col-span-2">{customer.address||'-'}</span></div></div>:null;
function blankItem():BusinessDocumentItem{return{id:generateId(),description:'',quantity:1,unit:'Unit',unitPrice:0,discount:0,taxRate:0}};
function makeBlankForm(type:BusinessDocumentType,source?:BusinessDocument,customers:Customer[]=[]){const customerId=source?.customerId||'';return{type,customerId,date:today(),validUntil:'',referenceNumber:source?.documentNumber||'',parentDocumentId:source?.id||'',deliveryAddress:source?.deliveryAddress||customers.find(c=>c.id===customerId)?.address||'',notes:source?.notes||'',status:'draft' as BusinessDocument['status'],items:source?.items?.length?source.items.map(i=>({...i,id:generateId()})):[blankItem()]}};
function updateItem(setForm:React.Dispatch<React.SetStateAction<any>>,form:any,index:number,patch:Partial<BusinessDocumentItem>){setForm({...form,items:form.items.map((x:BusinessDocumentItem,i:number)=>i===index?{...x,...patch}:x)})}

const InvoiceQuantityModal:React.FC<{source:BusinessDocument;quantities:Record<string,number>;onChange:(id:string,qty:number)=>void;onClose:()=>void;onCreate:()=>void}>=({source,quantities,onChange,onClose,onCreate})=><div className="fixed inset-0 z-[115] bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"><div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"><div className="p-5 border-b flex justify-between items-center"><div><p className="text-lg font-bold">Buat Invoice Bertahap</p><p className="text-xs text-slate-500 mt-1">Pilih quantity yang ingin ditagihkan dari {source.documentNumber}. Sisa akan tetap tersedia untuk invoice berikutnya.</p></div><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button></div><div className="p-5 space-y-3">{source.items.map(it=>{const max=it.quantity;const value=Math.min(max,Math.max(0,Number(quantities[it.id]??0)));return <div key={it.id} className="grid grid-cols-[1fr_110px] gap-3 items-center rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-semibold">{it.description}</p><p className="text-[11px] text-slate-500">Tersedia: {max} {it.unit} • {rupiah(it.unitPrice)}/{it.unit}</p></div><Input label="Qty invoice" type="number" min="0" max={max} value={value} onChange={e=>onChange(it.id,Math.min(max,Math.max(0,Number(e.target.value))))}/></div>})}</div><div className="p-5 border-t flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Batal</Button><Button onClick={onCreate}>Buat Invoice</Button></div></div></div>;

const TransactionTimeline:React.FC<{root:BusinessDocument;chain:Array<{kind:string;number:string;date:string;status:string;amount:number;id:string}>;onClose:()=>void;onOpen:(id:string)=>void}>=({root,chain,onClose,onOpen})=><div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"><div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"><div className="p-5 border-b flex justify-between items-center"><div><p className="text-lg font-bold text-slate-900">Alur Transaksi</p><p className="text-xs text-slate-500 mt-1">{root.customerName||'-'} • mulai dari {root.documentNumber}</p></div><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button></div><div className="p-5 space-y-3">{chain.map((item,i)=><button key={item.id} onClick={()=>onOpen(item.id)} className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition"><div className="flex flex-col items-center"><div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5"/></div>{i<chain.length-1&&<div className="w-px h-6 bg-slate-200"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">{item.kind}</span><span className="font-mono text-xs font-bold text-blue-600">{item.number}</span></div><p className="text-[11px] text-slate-500 mt-1">{item.date} • {item.status}</p></div><div className="text-right font-semibold text-sm">{rupiah(item.amount)}</div><ChevronRight className="w-4 h-4 text-slate-400"/></button>)}{!chain.length&&<p className="text-sm text-slate-500">Belum ada rangkaian dokumen.</p>}</div></div></div>;

const DocumentPreview:React.FC<{doc:BusinessDocument;onClose:()=>void;onEdit:()=>void;onNext:()=>void;onInvoice:()=>void}>=({doc,onClose,onEdit,onNext,onInvoice})=>{const org=StorageService.getOrganization();const customer=StorageService.getCustomers().find(c=>c.id===doc.customerId);const pdf=()=>exportElementToPdf({elementId:'business-document-print',filename:`${doc.documentNumber.replaceAll('/','-')}.pdf`});const hasNext=!!nextType[doc.documentType];return <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"><div className="max-w-5xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-2 mb-3 print:hidden"><div className="text-white"><p className="font-bold">Preview {doc.documentNumber}</p><p className="text-xs text-slate-300">{TYPES.find(t=>t.value===doc.documentType)?.label} • {statusLabels[doc.status]}</p></div><div className="flex flex-wrap gap-2">{hasNext&&<Button onClick={onNext}><ArrowRight className="w-4 h-4"/> Buat {nextLabel[doc.documentType]}</Button>}{doc.documentType==='bast'&&<Button onClick={onInvoice}>Invoice</Button>}<Button variant="secondary" onClick={onEdit}>Edit</Button><Button variant="secondary" onClick={()=>window.print()}><Printer className="w-4 h-4"/> Cetak</Button><Button onClick={pdf}><Download className="w-4 h-4"/> PDF</Button><button onClick={onClose} className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center"><X className="w-5 h-5"/></button></div></div><div id="business-document-print" className="bg-white text-slate-900 shadow-2xl p-[14mm] min-h-[277mm] print:shadow-none print:p-[12mm]"><div className="flex justify-between gap-8 border-b-2 border-slate-900 pb-5"><div><h1 className="text-xl font-black tracking-tight">{org.name}</h1><p className="text-xs text-slate-500 mt-1">{org.address}</p><p className="text-xs text-slate-500">{org.city}, {org.province} • {org.phone} • {org.email}</p>{org.npwp&&<p className="text-xs text-slate-500">NPWP: {org.npwp}</p>}</div><div className="text-right"><h2 className="text-2xl font-black uppercase">{TYPES.find(t=>t.value===doc.documentType)?.label}</h2><p className="font-mono text-sm font-bold mt-1">{doc.documentNumber}</p><p className="text-xs text-slate-500">Tanggal: {doc.date}</p>{doc.validUntil&&<p className="text-xs text-slate-500">Berlaku: {doc.validUntil}</p>}</div></div><div className="grid grid-cols-2 gap-8 py-6"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kepada</p><p className="font-bold mt-1">{customer?.companyName||doc.customerName||'-'}</p><p className="text-xs text-slate-500">{customer?.address||''}</p><p className="text-xs text-slate-500">{customer?.email||''}</p></div><div>{doc.referenceNumber&&<><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Referensi</p><p className="font-mono text-sm font-semibold mt-1">{doc.referenceNumber}</p></>}{doc.deliveryAddress&&<><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">Alamat pengiriman / serah terima</p><p className="text-xs mt-1">{doc.deliveryAddress}</p></>}</div></div><table className="w-full text-xs border-collapse"><thead><tr className="bg-slate-100"><th className="p-2 text-left border-b">Deskripsi</th><th className="p-2 text-right border-b">Qty</th><th className="p-2 text-left border-b">Satuan</th><th className="p-2 text-right border-b">Harga</th><th className="p-2 text-right border-b">Total</th></tr></thead><tbody>{doc.items.map(it=><tr key={it.id}><td className="p-2 border-b">{it.description||'-'}</td><td className="p-2 text-right border-b">{it.quantity}</td><td className="p-2 border-b">{it.unit}</td><td className="p-2 text-right border-b">{rupiah(it.unitPrice)}</td><td className="p-2 text-right border-b font-semibold">{rupiah(Math.max(0,it.quantity*it.unitPrice-it.discount))}</td></tr>)}</tbody></table><div className="flex justify-end py-5"><div className="w-72 text-xs space-y-2"><div className="flex justify-between"><span>Subtotal</span><strong>{rupiah(doc.subtotal)}</strong></div><div className="flex justify-between"><span>Pajak</span><strong>{rupiah(doc.taxAmount)}</strong></div><div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm"><span className="font-bold">TOTAL</span><strong>{rupiah(doc.grandTotal)}</strong></div></div></div>{doc.notes&&<div className="border-t pt-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Catatan & Ketentuan</p><p className="text-xs whitespace-pre-wrap mt-2 leading-5">{doc.notes}</p></div>}<div className="mt-14 flex justify-end"><div className="w-52 text-center text-xs"><p>{org.city}, {doc.date}</p><div className="h-20"></div><div className="border-b border-slate-900 font-bold pb-1">{org.signatureName||'Penanggung Jawab'}</div><p className="text-slate-500 mt-1">{org.signatureRole||'Authorized Signatory'}</p></div></div><div className="mt-10 pt-3 border-t text-[9px] text-slate-400 flex justify-between"><span>Dokumen dibuat melalui sistem administrasi bisnis.</span><span>{statusLabels[doc.status]}</span></div></div></div></div>};
