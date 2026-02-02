const express = require('express');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('vendor', 'name category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('vendor');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    const orderId = `ORD-${String(orderCount + 1).padStart(3, '0')}`;
    
    const order = new Order({ ...req.body, orderId });
    await order.save();
    
    const populatedOrder = await Order.findById(order._id).populate('vendor');
    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('vendor');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeProjects = await Order.countDocuments({ status: 'in-progress' });
    const newRequests = await Order.countDocuments({ status: 'new' });
    const completedWork = await Order.countDocuments({ status: 'completed' });
    
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const monthlyRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalOrders,
      activeProjects,
      newRequests,
      completedWork,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;