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
  Eye,
  Printer,
  Send,
  Menu,
  CheckSquare,
  Clock,
  Bell,
  User,
  CalendarDays
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTodoDialog, setShowTodoDialog] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
          <h1 className="text-lg md:text-2xl font-bold text-white">RechnungsManager</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
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
          
          {/* Quick ToDo Button */}
          <Dialog open={showTodoDialog} onOpenChange={setShowTodoDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                <CheckSquare className="h-4 w-4 mr-2" />
                ToDo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Schnell-ToDo erstellen</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Erstelle eine neue Aufgabe mit Erinnerung
                </DialogDescription>
              </DialogHeader>
              <QuickTodoForm onSuccess={() => setShowTodoDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-slate-800 p-2"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-2">
          <div className="flex flex-col space-y-2">
            <Link 
              to="/" 
              className="text-slate-300 hover:text-white transition-colors py-2 px-2 rounded hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📈 Dashboard
            </Link>
            <Link 
              to="/customers" 
              className="text-slate-300 hover:text-white transition-colors py-2 px-2 rounded hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              👥 Kunden
            </Link>
            <Link 
              to="/invoices" 
              className="text-slate-300 hover:text-white transition-colors py-2 px-2 rounded hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📄 Rechnungen
            </Link>
            <Link 
              to="/company" 
              className="text-slate-300 hover:text-white transition-colors py-2 px-2 rounded hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏢 Firmendaten
            </Link>
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white mx-2 mt-2"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowTodoDialog(true);
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              ToDo erstellen
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

// Quick ToDo Form Component
const QuickTodoForm = ({ onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customer_id: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '09:00'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const todoData = {
        title: formData.title,
        description: formData.description || null,
        customer_id: formData.customer_id || null,
        due_date: formData.due_date,
        due_time: formData.due_time
      };

      await axios.post(`${API}/todos`, todoData);
      toast.success('ToDo erfolgreich erstellt! Erinnerung wird gesendet.');
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        customer_id: '',
        due_date: new Date().toISOString().split('T')[0],
        due_time: '09:00'
      });
    } catch (error) {
      console.error('Error creating ToDo:', error);
      toast.error('Fehler beim Erstellen des ToDos');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-slate-200">Aufgabe *</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="z.B. Rasen mähen, Kunde anrufen..."
          required
        />
      </div>
      
      <div>
        <Label className="text-slate-200">Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="Zusätzliche Details..."
          rows={3}
        />
      </div>

      <div>
        <Label className="text-slate-200">Kunde (optional)</Label>
        <Select value={formData.customer_id} onValueChange={(value) => handleChange('customer_id', value)}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Kunde auswählen (optional)" />
          </SelectTrigger>
          <SelectContent className="z-[1100]">
            <SelectItem value="">Kein Kunde</SelectItem>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} - {customer.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-200">Datum *</Label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => handleChange('due_date', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-slate-200">Uhrzeit *</Label>
          <Input
            type="time"
            value={formData.due_time}
            onChange={(e) => handleChange('due_time', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        <Clock className="h-4 w-4 mr-2" />
        ToDo mit Erinnerung erstellen
      </Button>
    </form>
  );
};
const Dashboard = () => {
  const [topCustomers, setTopCustomers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [stats, setStats] = useState({});
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [upcomingTodos, setUpcomingTodos] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, revenueRes, statsRes, todosRes] = await Promise.all([
        axios.get(`${API}/dashboard/top-customers`),
        axios.get(`${API}/dashboard/monthly-revenue`),
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/todos?status=pending`)
      ]);
      
      setTopCustomers(customersRes.data);
      setMonthlyRevenue(revenueRes.data);
      setStats(statsRes.data);
      
      // Get upcoming todos (next 5)
      const sortedTodos = todosRes.data
        .sort((a, b) => new Date(`${a.due_date}T${a.due_time}`) - new Date(`${b.due_date}T${b.due_time}`))
        .slice(0, 5);
      setUpcomingTodos(sortedTodos);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Fehler beim Laden der Dashboard-Daten');
    }
  };

  const markTodoCompleted = async (todoId) => {
    try {
      await axios.put(`${API}/todos/${todoId}`, { status: 'completed' });
      toast.success('ToDo als erledigt markiert');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Fehler beim Aktualisieren des ToDos');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
      {/* Stats Cards with ToDos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Kunden</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">{stats.total_customers || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Rechnungen</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">{stats.total_invoices || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">ToDos</CardTitle>
            <CheckSquare className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">{stats.total_todos || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Offene ToDos</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">{stats.pending_todos || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700 col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Gesamtumsatz</CardTitle>
            <Euro className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">
              €{(stats.total_revenue || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700 col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Offene Rechnungen</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-white">{stats.pending_invoices || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Customers and Quick Invoice - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top 5 Kunden */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg md:text-xl">Top 5 Kunden</CardTitle>
            <CardDescription className="text-slate-400 text-sm">Nach Gesamtumsatz sortiert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm md:text-base truncate">{customer.name}</p>
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-slate-400">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {customer.postal_code} {customer.city}
                        </span>
                        <span>{customer.invoice_count} Rechnungen</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-white text-sm md:text-base">
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
            <CardTitle className="text-white text-lg md:text-xl">Schnell-Rechnung</CardTitle>
            <CardDescription className="text-slate-400 text-sm">Neue Rechnung erstellen</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Neue Rechnung erstellen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto mx-4" style={{zIndex: 1000}}>
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
            
            <div className="mt-4 md:mt-6 space-y-3">
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

      {/* Enhanced Monthly Revenue Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg md:text-xl">Monatlicher Umsatz</CardTitle>
          <CardDescription className="text-slate-400 text-sm">Umsatzentwicklung über Zeit - wischen für weitere Monate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 md:h-64 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            <div className="flex items-end justify-start space-x-2 md:space-x-3 min-w-max pb-4">
              {/* Generate months for multiple years */}
              {(() => {
                const months = [];
                const currentYear = new Date().getFullYear();
                const startYear = 2025;
                const endYear = currentYear + 2; // Show current year + 2 future years
                
                const monthNames = [
                  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
                  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
                ];

                // Create data structure for all months across years
                for (let year = startYear; year <= endYear; year++) {
                  for (let month = 0; month < 12; month++) {
                    const monthKey = `${monthNames[month]} ${year}`;
                    
                    // Find revenue data for this month/year
                    const revenueData = monthlyRevenue.find(data => data.month === monthKey);
                    const revenue = revenueData ? revenueData.revenue : 0;
                    
                    months.push({
                      key: monthKey,
                      month: monthNames[month],
                      year: year,
                      revenue: revenue
                    });
                  }
                }

                const maxRevenue = Math.max(...months.map(d => d.revenue), 1);
                
                return months.map((data, index) => {
                  const height = data.revenue > 0 ? Math.max((data.revenue / maxRevenue) * 100, 5) : 5;
                  const isCurrentMonth = data.month === monthNames[new Date().getMonth()] && data.year === new Date().getFullYear();
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 min-w-[45px] md:min-w-[55px]">
                      <div 
                        className={`rounded-t transition-all duration-500 hover:opacity-80 w-full cursor-pointer ${
                          data.revenue > 0 
                            ? isCurrentMonth 
                              ? 'bg-blue-400 shadow-lg' 
                              : 'bg-blue-500 hover:bg-blue-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${data.key}: €${data.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
                      />
                      <div className="text-center">
                        <span className="text-xs text-slate-400 font-medium block">{data.month}</span>
                        <span className="text-xs text-slate-500 block">{data.year}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">← Wischen Sie nach links/rechts für weitere Monate →</p>
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
                <SelectContent className="z-[1100]">
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
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchCompanyData();
    fetchCustomers();
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

  const fetchCompanyData = async () => {
    try {
      const response = await axios.get(`${API}/company`);
      setCompanyData(response.data);
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
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
                  <div className="flex space-x-2 flex-wrap gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowPrintDialog(true);
                      }}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice && !showPrintDialog} onOpenChange={() => setSelectedInvoice(null)}>
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

      {/* Print Dialog */}
      {selectedInvoice && showPrintDialog && (
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Rechnung drucken</DialogTitle>
            </DialogHeader>
            <PrintInvoice 
              invoice={selectedInvoice}
              companyData={companyData}
              customer={customers.find(c => c.id === selectedInvoice.customer_id)}
            />
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

// Professional German Invoice Print Component
const PrintInvoice = ({ invoice, companyData, customer }) => {
  const printInvoice = () => {
    window.print();
  };

  if (!invoice || !companyData || !customer) return null;

  return (
    <div className="print-container">
      <div className="no-print mb-4 flex justify-end">
        <Button onClick={printInvoice} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" />
          Drucken
        </Button>
      </div>
      
      <div className="print-friendly bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        {/* Company Header with Logo Area */}
        <div className="border-b-2 border-gray-300 pb-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{companyData.company_name}</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{companyData.address}, {companyData.postal_code} {companyData.city}</p>
            </div>
          </div>
        </div>

        {/* Invoice Header and Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Customer Address */}
          <div>
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">{companyData.company_name} · {companyData.address} · {companyData.postal_code} {companyData.city}</p>
              <div className="border-b border-gray-300 pb-4">
                <div className="text-sm font-medium text-gray-800">
                  <p className="font-bold">{customer.name}</p>
                  <p>{customer.address}</p>
                  <p>{customer.postal_code} {customer.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">RECHNUNG</h2>
              <table className="text-sm text-right ml-auto">
                <tbody>
                  <tr>
                    <td className="pr-4 text-gray-600">RECHNUNGSNUMMER:</td>
                    <td className="font-medium">{invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-gray-600">RECHNUNGSDATUM:</td>
                    <td className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-gray-600">ZAHLUNGSZIEL:</td>
                    <td className="font-medium">30 TAGE</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-gray-600">FÄLLIGKEITSDATUM:</td>
                    <td className="font-medium">{new Date(invoice.due_date).toLocaleDateString('de-DE')}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-gray-600">STEUERNUMMER:</td>
                    <td className="font-medium">{companyData.tax_number}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800">
            Rechnung Nummer {invoice.invoice_number.split('-')[1]} ({customer.name})
          </h3>
        </div>

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            Sehr geehrte Damen und Herren,
          </p>
          <p className="text-sm text-gray-700 mt-2">
            wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen. Im Folgenden finden Sie die detaillierte Aufstellung der erbrachten Leistung und der entsprechenden Kosten.
          </p>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="text-left py-3 text-sm font-bold text-gray-800">Nr.</th>
                <th className="text-left py-3 text-sm font-bold text-gray-800">Beschreibung</th>
                <th className="text-center py-3 text-sm font-bold text-gray-800">Datum</th>
                <th className="text-center py-3 text-sm font-bold text-gray-800">Menge</th>
                <th className="text-center py-3 text-sm font-bold text-gray-800">Einheit</th>
                <th className="text-right py-3 text-sm font-bold text-gray-800">Einzelpreis</th>
                <th className="text-center py-3 text-sm font-bold text-gray-800">USt %</th>
                <th className="text-right py-3 text-sm font-bold text-gray-800">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 text-sm">{index + 1}</td>
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="text-center py-3 text-sm">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</td>
                  <td className="text-center py-3 text-sm">{item.quantity}</td>
                  <td className="text-center py-3 text-sm">{item.unit}</td>
                  <td className="text-right py-3 text-sm">{item.unit_price.toFixed(2)}</td>
                  <td className="text-center py-3 text-sm">19</td>
                  <td className="text-right py-3 text-sm font-medium">{item.total_price.toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 text-right text-sm font-bold">Nettobetrag</td>
                  <td className="py-2 text-right text-sm font-bold w-24">{invoice.subtotal.toFixed(2)}€</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 text-right text-sm">USt 19.00 %</td>
                  <td className="py-2 text-right text-sm w-24">{invoice.tax_amount.toFixed(2)}€</td>
                </tr>
                <tr className="border-b-2 border-gray-400">
                  <td className="py-3 text-right text-lg font-bold">Gesamtsumme</td>
                  <td className="py-3 text-right text-lg font-bold w-24">{invoice.total_amount.toFixed(2)}€</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Closing */}
        <div className="mb-8">
          <p className="text-sm text-gray-700 font-medium">
            Vielen Dank für Ihr Vertrauen!
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Ihr Team vom {companyData.company_name}
          </p>
        </div>

        {/* Footer with Company Details */}
        <div className="border-t border-gray-400 pt-4 text-xs text-gray-600">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="font-bold mb-1">{companyData.address.split(',')[0] || companyData.address}</p>
              <p>{companyData.postal_code} {companyData.city}</p>
              <p>TEL: {companyData.phone}</p>
              <p>E-MAIL: {companyData.email}</p>
              {companyData.website && <p>WEB: {companyData.website}</p>}
            </div>
            <div>
              <p className="font-bold mb-1">COMDIRECT BANK AG</p>
              <p>IBAN: {companyData.iban}</p>
              <p>BIC: {companyData.bic}</p>
            </div>
            <div>
              <p className="font-bold mb-1">STEUERNUMMER {companyData.tax_number}</p>
              <p>PAYPAL: {companyData.email}</p>
            </div>
            <div className="text-right">
              <p>Zahlbar innerhalb von 30 Tagen ohne Abzug.</p>
              <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-gray-300">
            <h4 className="font-bold text-gray-800 mb-2">Zusätzliche Bemerkungen:</h4>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
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