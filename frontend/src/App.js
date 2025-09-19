import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Import Shadcn components
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { 
  PlusCircle, 
  Users, 
  FileText, 
  Building, 
  BarChart3, 
  Euro, 
  Calendar,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Edit,
  Eye
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">RechnungsManager</h1>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/customers" className="text-slate-300 hover:text-white transition-colors">
            Kunden
          </Link>
          <Link to="/invoices" className="text-slate-300 hover:text-white transition-colors">
            Rechnungen
          </Link>
          <Link to="/company" className="text-slate-300 hover:text-white transition-colors">
            Firmendaten
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [topCustomers, setTopCustomers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [stats, setStats] = useState({});
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, revenueRes, statsRes] = await Promise.all([
        axios.get(`${API}/dashboard/top-customers`),
        axios.get(`${API}/dashboard/monthly-revenue`),
        axios.get(`${API}/dashboard/stats`)
      ]);
      
      setTopCustomers(customersRes.data);
      setMonthlyRevenue(revenueRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Fehler beim Laden der Dashboard-Daten');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Kunden</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total_customers || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Rechnungen</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total_invoices || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              €{(stats.total_revenue || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Offene Rechnungen</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pending_invoices || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Customers and Quick Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Kunden */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top 5 Kunden</CardTitle>
            <CardDescription className="text-slate-400">Nach Gesamtumsatz sortiert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{customer.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {customer.postal_code} {customer.city}
                        </span>
                        <span>{customer.invoice_count} Rechnungen</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      €{customer.total_revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Invoice */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Schnell-Rechnung</CardTitle>
            <CardDescription className="text-slate-400">Neue Rechnung erstellen</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Neue Rechnung erstellen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto" style={{zIndex: 1000}}>
                <DialogHeader>
                  <DialogTitle className="text-white">Neue Rechnung</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Erstelle eine neue Rechnung für einen Kunden
                  </DialogDescription>
                </DialogHeader>
                <InvoiceForm onSuccess={() => {
                  setShowInvoiceDialog(false);
                  fetchDashboardData();
                }} />
              </DialogContent>
            </Dialog>
            
            <div className="mt-6 space-y-3">
              <Link to="/customers">
                <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700">
                  <Users className="h-4 w-4 mr-2" />
                  Kunden verwalten
                </Button>
              </Link>
              <Link to="/company">
                <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700">
                  <Building className="h-4 w-4 mr-2" />
                  Firmendaten bearbeiten
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Monatlicher Umsatz</CardTitle>
          <CardDescription className="text-slate-400">Umsatzentwicklung über Zeit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlyRevenue.map((data, index) => {
              const maxRevenue = Math.max(...monthlyRevenue.map(d => d.revenue));
              const height = Math.max((data.revenue / maxRevenue) * 100, 5);
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-400 min-w-[40px]"
                    style={{ height: `${height}%` }}
                    title={`€${data.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
                  />
                  <span className="text-xs text-slate-400 transform -rotate-45">{data.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Invoice Form Component
const InvoiceForm = ({ onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([{ type: 'service', description: '', unit: 'hours', quantity: 1, unit_price: 0 }]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { type: 'service', description: '', unit: 'hours', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.19;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Bitte wählen Sie einen Kunden aus');
      return;
    }

    try {
      const invoiceData = {
        customer_id: selectedCustomer,
        items: items.map(item => ({
          type: item.type,
          description: item.description,
          unit: item.unit,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        })),
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes: notes
      };

      await axios.post(`${API}/invoices`, invoiceData);
      toast.success('Rechnung erfolgreich erstellt');
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Fehler beim Erstellen der Rechnung');
    }
  };

  const totals = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-200">Kunde</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Kunde auswählen" />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-200">Rechnungsdatum</Label>
          <Input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-200">Positionen</Label>
          <Button type="button" onClick={addItem} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-1" />
            Position hinzufügen
          </Button>
        </div>
        
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-2">
              <Select value={item.type} onValueChange={(value) => updateItem(index, 'type', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  <SelectItem value="service">Dienstleistung</SelectItem>
                  <SelectItem value="product">Produkt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Input
                placeholder="Beschreibung"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="col-span-2">
              <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Stunden</SelectItem>
                  <SelectItem value="pieces">Stück</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="m2">m²</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Input
                type="number"
                step="0.01"
                placeholder="Menge"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Preis"
                value={item.unit_price}
                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-700 p-4 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Zwischensumme:</span>
            <span>€{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>MwSt. (19%):</span>
            <span>€{totals.tax.toFixed(2)}</span>
          </div>
          <Separator className="bg-slate-600" />
          <div className="flex justify-between font-bold text-white">
            <span>Gesamtsumme:</span>
            <span>€{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-slate-200">Notizen</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="Zusätzliche Notizen..."
        />
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Rechnung erstellen
      </Button>
    </form>
  );
};

// Customers Page Component
const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Fehler beim Laden der Kunden');
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      try {
        await axios.delete(`${API}/customers/${customerId}`);
        toast.success('Kunde erfolgreich gelöscht');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Fehler beim Löschen des Kunden');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Kunden-Verwaltung</h1>
          <p className="text-slate-400">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Neuer Kunde
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Neuen Kunde hinzufügen</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSuccess={() => {
                setShowAddDialog(false);
                fetchCustomers();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{customer.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {customer.city}, {customer.postal_code}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCustomer(customer)}
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-300">
                  <Mail className="h-4 w-4 mr-2" />
                  {customer.email}
                </div>
                <div className="flex items-center text-slate-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  {customer.address}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Kunde bearbeiten</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              customer={editingCustomer}
              onSuccess={() => {
                setEditingCustomer(null);
                fetchCustomers();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Customer Form Component
const CustomerForm = ({ customer, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    address: customer?.address || '',
    postal_code: customer?.postal_code || '',
    city: customer?.city || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (customer) {
        await axios.put(`${API}/customers/${customer.id}`, formData);
        toast.success('Kunde erfolgreich aktualisiert');
      } else {
        await axios.post(`${API}/customers`, formData);
        toast.success('Kunde erfolgreich erstellt');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Fehler beim Speichern des Kunden');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-slate-200">Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          required
        />
      </div>
      <div>
        <Label className="text-slate-200">E-Mail</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          required
        />
      </div>
      <div>
        <Label className="text-slate-200">Adresse</Label>
        <Input
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-200">PLZ</Label>
          <Input
            value={formData.postal_code}
            onChange={(e) => handleChange('postal_code', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">Stadt</Label>
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        {customer ? 'Kunde aktualisieren' : 'Kunde erstellen'}
      </Button>
    </form>
  );
};

// Invoices Page Component
const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Fehler beim Laden der Rechnungen');
    }
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    try {
      await axios.put(`${API}/invoices/${invoiceId}/status`, { status });
      toast.success('Status erfolgreich aktualisiert');
      fetchInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Entwurf' },
      sent: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Versendet' },
      paid: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Bezahlt' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Rechnungs-Übersicht</h1>
          <p className="text-slate-400">Verwalten Sie Ihre Rechnungen</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Neue Rechnung</DialogTitle>
            </DialogHeader>
            <InvoiceForm onSuccess={() => {
              setShowAddDialog(false);
              fetchInvoices();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-white">{invoice.invoice_number}</h3>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-slate-300">{invoice.customer_name}</p>
                  <div className="flex items-center space-x-6 text-sm text-slate-400">
                    <span>Datum: {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
                    <span>Fällig: {new Date(invoice.due_date).toLocaleDateString('de-DE')}</span>
                    <span>{invoice.items.length} Position(en)</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-2xl font-bold text-white">
                    €{invoice.total_amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex space-x-2">
                    <Select value={invoice.status} onValueChange={(status) => updateInvoiceStatus(invoice.id, status)}>
                      <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="sent">Versendet</SelectItem>
                        <SelectItem value="paid">Bezahlt</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Rechnung Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Rechnungsnummer:</p>
                  <p className="text-white font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-slate-400">Kunde:</p>
                  <p className="text-white font-medium">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Datum:</p>
                  <p className="text-white font-medium">
                    {new Date(selectedInvoice.invoice_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Fällig:</p>
                  <p className="text-white font-medium">
                    {new Date(selectedInvoice.due_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
              
              <Separator className="bg-slate-600" />
              
              <div>
                <h4 className="text-white font-medium mb-3">Positionen:</h4>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                      <div>
                        <p className="text-white font-medium">{item.description}</p>
                        <p className="text-slate-400 text-sm">
                          {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-white font-medium">
                        €{item.total_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator className="bg-slate-600" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Zwischensumme:</span>
                  <span>€{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>MwSt. (19%):</span>
                  <span>€{selectedInvoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Gesamtsumme:</span>
                  <span>€{selectedInvoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Company Page Component
const CompanyPage = () => {
  const [companyData, setCompanyData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await axios.get(`${API}/company`);
      setCompanyData(response.data);
      if (!response.data) {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setIsEditing(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Firmendaten</h1>
          <p className="text-slate-400">Verwalten Sie Ihre Unternehmensdaten</p>
        </div>
        {companyData && !isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {companyData ? 'Firmendaten bearbeiten' : 'Firmendaten einrichten'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm 
              company={companyData}
              onSuccess={(data) => {
                setCompanyData(data);
                setIsEditing(false);
              }}
            />
          </CardContent>
        </Card>
      ) : companyData ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{companyData.company_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Adresse</p>
                  <p className="text-white">{companyData.address}</p>
                  <p className="text-white">{companyData.postal_code} {companyData.city}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Kontakt</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-white">
                      <Phone className="h-4 w-4 mr-2" />
                      {companyData.phone}
                    </div>
                    <div className="flex items-center text-white">
                      <Mail className="h-4 w-4 mr-2" />
                      {companyData.email}
                    </div>
                    {companyData.website && (
                      <p className="text-blue-400">{companyData.website}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Steuernummer</p>
                  <p className="text-white">{companyData.tax_number}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Bankverbindung</p>
                  <div className="space-y-1">
                    <p className="text-white">{companyData.bank_name}</p>
                    <p className="text-white">IBAN: {companyData.iban}</p>
                    <p className="text-white">BIC: {companyData.bic}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

// Company Form Component
const CompanyForm = ({ company, onSuccess }) => {
  const [formData, setFormData] = useState({
    company_name: company?.company_name || '',
    address: company?.address || '',
    postal_code: company?.postal_code || '',
    city: company?.city || '',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    tax_number: company?.tax_number || '',
    bank_name: company?.bank_name || '',
    iban: company?.iban || '',
    bic: company?.bic || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API}/company`, formData);
      toast.success('Firmendaten erfolgreich gespeichert');
      onSuccess(response.data);
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Fehler beim Speichern der Firmendaten');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-slate-200">Firmenname</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-slate-200">Adresse</Label>
          <Input
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">PLZ</Label>
          <Input
            value={formData.postal_code}
            onChange={(e) => handleChange('postal_code', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">Stadt</Label>
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">Telefon</Label>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">E-Mail</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-slate-200">Website (optional)</Label>
          <Input
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="https://..."
          />
        </div>
        <div>
          <Label className="text-slate-200">Steuernummer</Label>
          <Input
            value={formData.tax_number}
            onChange={(e) => handleChange('tax_number', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">Bank</Label>
          <Input
            value={formData.bank_name}
            onChange={(e) => handleChange('bank_name', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">IBAN</Label>
          <Input
            value={formData.iban}
            onChange={(e) => handleChange('iban', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">BIC</Label>
          <Input
            value={formData.bic}
            onChange={(e) => handleChange('bic', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Firmendaten speichern
      </Button>
    </form>
  );
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/company" element={<CompanyPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;