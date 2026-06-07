import unittest
import json
from app import app

class AuraFinanceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_market_index(self):
        response = self.app.get('/api/market_index')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    def test_watchlist(self):
        response = self.app.get('/api/watchlist')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        if len(data) > 0:
            self.assertIn('ticker', data[0])
            self.assertIn('price', data[0])

    def test_ml_metrics(self):
        response = self.app.get('/api/ml_metrics')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('ensemble', data)
        self.assertIn('gemini', data)
        self.assertEqual(data['gemini']['model_version'], 'gemini-2.5-flash')

    def test_index_health_check(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'Aura Finance Backend API')

if __name__ == '__main__':
    unittest.main()
