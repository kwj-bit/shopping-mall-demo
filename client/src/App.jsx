import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import MyPage from './pages/MyPage'
import Admin from './pages/admin/Admin'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Order from './pages/Order'
import OrderComplete from './pages/OrderComplete'
import OrderFailure from './pages/OrderFailure'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order" element={<Order />} />
        <Route path="/order/complete" element={<OrderComplete />} />
        <Route path="/order/failure" element={<OrderFailure />} />
      </Routes>
    </Router>
  );
}

export default App