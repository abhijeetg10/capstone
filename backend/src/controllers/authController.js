import jwt from 'jsonwebtoken';

// Mock login controller for demonstration purposes
export const login = (req, res) => {
    try {
        const { role } = req.body;
        
        if (!role) {
            return res.status(400).json({ error: 'Role is required for login' });
        }

        // Validate role against expected roles
        const validRoles = ['hospital', 'laboratory', 'pharmacy', 'administration', 'researcher'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role provided' });
        }

        // Create a mock user object based on the role
        const mockUser = {
            id: Math.floor(Math.random() * 1000) + 1,
            username: `${role}_user`,
            role: role,
            institution_id: 1 // Default mock institution ID for all for now
        };

        // Generate JWT Token
        const token = jwt.sign(mockUser, process.env.JWT_SECRET || 'supersecret', { expiresIn: '24h' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: mockUser
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};
