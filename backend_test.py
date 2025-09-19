import requests
import sys
import json
from datetime import datetime, timedelta

class InvoiceManagerAPITester:
    def __init__(self, base_url="https://invoicenow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customer_id = None
        self.created_invoice_id = None
        self.created_todo_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_customer_crud(self):
        """Test Customer CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CUSTOMER CRUD OPERATIONS")
        print("="*50)
        
        # Test GET customers (empty initially)
        success, customers = self.run_test(
            "Get All Customers",
            "GET",
            "customers",
            200
        )
        
        # Test CREATE customer
        customer_data = {
            "name": "Test Kunde GmbH",
            "email": "test@kunde.de",
            "address": "Teststraße 123",
            "postal_code": "12345",
            "city": "Berlin"
        }
        
        success, created_customer = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success and 'id' in created_customer:
            self.created_customer_id = created_customer['id']
            print(f"   Created customer ID: {self.created_customer_id}")
            
            # Test GET specific customer
            self.run_test(
                "Get Specific Customer",
                "GET",
                f"customers/{self.created_customer_id}",
                200
            )
            
            # Test UPDATE customer
            updated_data = customer_data.copy()
            updated_data['city'] = "München"
            
            self.run_test(
                "Update Customer",
                "PUT",
                f"customers/{self.created_customer_id}",
                200,
                data=updated_data
            )
            
            # Test GET customers again (should have 1 customer)
            self.run_test(
                "Get All Customers (After Create)",
                "GET",
                "customers",
                200
            )

    def test_company_data(self):
        """Test Company Data operations"""
        print("\n" + "="*50)
        print("TESTING COMPANY DATA OPERATIONS")
        print("="*50)
        
        # Test GET company (empty initially)
        self.run_test(
            "Get Company Data (Empty)",
            "GET",
            "company",
            200
        )
        
        # Test CREATE/UPDATE company
        company_data = {
            "company_name": "Test Firma GmbH",
            "address": "Firmenstraße 456",
            "postal_code": "54321",
            "city": "Hamburg",
            "phone": "+49 40 123456",
            "email": "info@testfirma.de",
            "website": "https://testfirma.de",
            "tax_number": "DE123456789",
            "bank_name": "Deutsche Bank",
            "iban": "DE89370400440532013000",
            "bic": "COBADEFFXXX"
        }
        
        success, created_company = self.run_test(
            "Create/Update Company Data",
            "POST",
            "company",
            200,
            data=company_data
        )
        
        # Test GET company again
        self.run_test(
            "Get Company Data (After Create)",
            "GET",
            "company",
            200
        )

    def test_invoice_operations(self):
        """Test Invoice operations"""
        print("\n" + "="*50)
        print("TESTING INVOICE OPERATIONS")
        print("="*50)
        
        if not self.created_customer_id:
            print("❌ Cannot test invoices - no customer created")
            return
        
        # Test GET invoices (empty initially)
        self.run_test(
            "Get All Invoices",
            "GET",
            "invoices",
            200
        )
        
        # Test CREATE invoice
        today = datetime.now()
        due_date = today + timedelta(days=30)
        
        invoice_data = {
            "customer_id": self.created_customer_id,
            "items": [
                {
                    "type": "service",
                    "description": "Webentwicklung",
                    "unit": "hours",
                    "quantity": 10.0,
                    "unit_price": 85.0
                },
                {
                    "type": "product",
                    "description": "Domain-Registrierung",
                    "unit": "pieces",
                    "quantity": 1.0,
                    "unit_price": 15.0
                }
            ],
            "invoice_date": today.isoformat(),
            "due_date": due_date.isoformat(),
            "notes": "Test-Rechnung für API-Test"
        }
        
        success, created_invoice = self.run_test(
            "Create Invoice",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if success and 'id' in created_invoice:
            self.created_invoice_id = created_invoice['id']
            print(f"   Created invoice ID: {self.created_invoice_id}")
            
            # Verify German VAT calculation (19%)
            expected_subtotal = 10.0 * 85.0 + 1.0 * 15.0  # 865.0
            expected_tax = expected_subtotal * 0.19  # 164.35
            expected_total = expected_subtotal + expected_tax  # 1029.35
            
            if 'subtotal' in created_invoice:
                print(f"   Subtotal: €{created_invoice['subtotal']:.2f} (Expected: €{expected_subtotal:.2f})")
                print(f"   Tax (19%): €{created_invoice['tax_amount']:.2f} (Expected: €{expected_tax:.2f})")
                print(f"   Total: €{created_invoice['total_amount']:.2f} (Expected: €{expected_total:.2f})")
                
                if abs(created_invoice['total_amount'] - expected_total) < 0.01:
                    print("✅ German VAT calculation correct")
                else:
                    print("❌ German VAT calculation incorrect")
            
            # Test GET specific invoice
            self.run_test(
                "Get Specific Invoice",
                "GET",
                f"invoices/{self.created_invoice_id}",
                200
            )
            
            # Test UPDATE invoice status
            self.run_test(
                "Update Invoice Status",
                "PUT",
                f"invoices/{self.created_invoice_id}/status",
                200,
                data={"status": "sent"}
            )
            
            # Test GET invoices again
            self.run_test(
                "Get All Invoices (After Create)",
                "GET",
                "invoices",
                200
            )

    def test_dashboard_endpoints(self):
        """Test Dashboard endpoints"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD ENDPOINTS")
        print("="*50)
        
        # Test dashboard stats
        success, stats = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            expected_keys = ['total_customers', 'total_invoices', 'total_revenue', 'pending_invoices', 'total_todos', 'pending_todos']
            for key in expected_keys:
                if key in stats:
                    print(f"   {key}: {stats[key]}")
                else:
                    print(f"❌ Missing key in stats: {key}")
        
        # Test top customers
        self.run_test(
            "Get Top Customers",
            "GET",
            "dashboard/top-customers",
            200
        )
        
        # Test monthly revenue
        success, monthly_data = self.run_test(
            "Get Monthly Revenue",
            "GET",
            "dashboard/monthly-revenue",
            200
        )
        
        if success and isinstance(monthly_data, list):
            print(f"   Monthly revenue data points: {len(monthly_data)}")
            for data_point in monthly_data[:3]:  # Show first 3
                if 'month' in data_point and 'revenue' in data_point:
                    print(f"   {data_point['month']}: €{data_point['revenue']:.2f}")

    def test_error_handling(self):
        """Test error handling"""
        print("\n" + "="*50)
        print("TESTING ERROR HANDLING")
        print("="*50)
        
        # Test GET non-existent customer
        self.run_test(
            "Get Non-existent Customer",
            "GET",
            "customers/non-existent-id",
            404
        )
        
        # Test GET non-existent invoice
        self.run_test(
            "Get Non-existent Invoice",
            "GET",
            "invoices/non-existent-id",
            404
        )
        
        # Test CREATE invoice with invalid customer
        invalid_invoice_data = {
            "customer_id": "non-existent-customer",
            "items": [{"type": "service", "description": "Test", "unit": "hours", "quantity": 1, "unit_price": 50}],
            "invoice_date": datetime.now().isoformat(),
            "due_date": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        self.run_test(
            "Create Invoice with Invalid Customer",
            "POST",
            "invoices",
            404,
            data=invalid_invoice_data
        )

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete created customer (this should also clean up related data)
        if self.created_customer_id:
            self.run_test(
                "Delete Test Customer",
                "DELETE",
                f"customers/{self.created_customer_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Invoice Manager API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        try:
            # Test basic connectivity
            response = requests.get(f"{self.base_url}")
            print(f"✅ Base URL accessible - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Cannot reach base URL: {e}")
            return 1
        
        # Run all test suites
        self.test_customer_crud()
        self.test_company_data()
        self.test_invoice_operations()
        self.test_dashboard_endpoints()
        self.test_error_handling()
        
        # Cleanup
        self.cleanup()
        
        # Print results
        print("\n" + "="*50)
        print("TEST RESULTS SUMMARY")
        print("="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = InvoiceManagerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())