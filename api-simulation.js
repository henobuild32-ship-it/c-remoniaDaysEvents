// api-simulation.js - Simulation complète des API pour CÉRÉMONIA
// Ce fichier peut être exécuté avec Node.js pour simuler un backend

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Base de données simulée
const simulatedDB = {
    users: [
        { id: 1, email: 'test@ceremonia.com', name: 'Test User', password: 'password123', plan: 'free' }
    ],
    events: [
        { id: 1, name: 'Mariage Test', type: 'wedding', date: '2024-06-15', userId: 1, plan: 'free' }
    ],
    payments: [],
    subscriptions: []
};

// Middleware de simulation de retard réseau
const simulateNetworkDelay = (req, res, next) => {
    setTimeout(next, Math.random() * 1000 + 500); // 500-1500ms delay
};

// Middleware d'authentification simulée
const simulateAuth = (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    // Simulation de token JWT
    const tokenData = token.replace('Bearer ', '');
    
    // Dans une vraie application, on vérifierait le token JWT
    // Ici, on simule juste une vérification basique
    if (tokenData !== 'simulated-jwt-token') {
        return res.status(401).json({ error: 'Token invalide' });
    }
    
    next();
};

// Routes API

// 1. Authentification
app.post('/api/v1/auth/login', simulateNetworkDelay, (req, res) => {
    const { email, password } = req.body;
    
    const user = simulatedDB.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            token: 'simulated-jwt-token',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Identifiants incorrects'
        });
    }
});

app.post('/api/v1/auth/register', simulateNetworkDelay, (req, res) => {
    const { email, password, name } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    if (simulatedDB.users.find(u => u.email === email)) {
        return res.status(400).json({
            success: false,
            error: 'Un utilisateur avec cet email existe déjà'
        });
    }
    
    // Créer un nouvel utilisateur
    const newUser = {
        id: simulatedDB.users.length + 1,
        email,
        password,
        name,
        plan: 'free'
    };
    
    simulatedDB.users.push(newUser);
    
    res.json({
        success: true,
        token: 'simulated-jwt-token',
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            plan: newUser.plan
        }
    });
});

// 2. Gestion des événements
app.get('/api/v1/events', simulateNetworkDelay, simulateAuth, (req, res) => {
    const userId = 1; // Simulé depuis le token
    const userEvents = simulatedDB.events.filter(event => event.userId === userId);
    
    res.json({
        success: true,
        events: userEvents
    });
});

app.post('/api/v1/events', simulateNetworkDelay, simulateAuth, (req, res) => {
    const { name, type, date, location, theme } = req.body;
    
    const newEvent = {
        id: simulatedDB.events.length + 1,
        name,
        type,
        date,
        location: location || '',
        theme: theme || 'classic',
        userId: 1, // Simulé
        plan: 'free',
        createdAt: new Date().toISOString(),
        qrCode: `event-${Date.now()}`,
        stats: {
            photos: 0,
            videos: 0,
            messages: 0
        }
    };
    
    simulatedDB.events.push(newEvent);
    
    res.json({
        success: true,
        event: newEvent
    });
});

// 3. Paiements
app.post('/api/v1/payments/process', simulateNetworkDelay, simulateAuth, (req, res) => {
    const { method, amount, currency, details } = req.body;
    
    // Simuler un taux de succès de 90%
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const paymentRecord = {
            id: simulatedDB.payments.length + 1,
            transactionId,
            method,
            amount,
            currency,
            status: 'completed',
            userId: 1,
            timestamp: new Date().toISOString(),
            details
        };
        
        simulatedDB.payments.push(paymentRecord);
        
        res.json({
            success: true,
            transactionId,
            amount,
            currency,
            timestamp: paymentRecord.timestamp,
            message: 'Paiement traité avec succès'
        });
    } else {
        res.status(400).json({
            success: false,
            error: 'Paiement refusé. Veuillez vérifier vos informations.',
            errorCode: 'PAYMENT_DECLINED'
        });
    }
});

// 4. Vérification OFT
app.post('/api/v1/payments/oft/verify', simulateNetworkDelay, (req, res) => {
    const { transactionId, amount } = req.body;
    
    // Simuler une vérification
    const isVerified = Math.random() > 0.2;
    
    if (isVerified) {
        res.json({
            success: true,
            verified: true,
            transactionId,
            amount,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(400).json({
            success: false,
            verified: false,
            error: 'Transaction OFT non vérifiée'
        });
    }
});

// 5. Statut des paiements mobiles
app.post('/api/v1/payments/mobile/status', simulateNetworkDelay, (req, res) => {
    const { transactionId, provider } = req.body;
    
    // Simuler différents statuts
    const statuses = ['pending', 'completed', 'failed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
        success: status === 'completed',
        status,
        transactionId,
        provider
    });
});

// 6. Abonnements
app.post('/api/v1/subscriptions/create', simulateNetworkDelay, simulateAuth, (req, res) => {
    const { plan, amount } = req.body;
    
    // Générer un ID d'abonnement
    const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Calculer la date d'expiration (1 an)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const subscription = {
        id: simulatedDB.subscriptions.length + 1,
        subscriptionId,
        userId: 1,
        plan,
        amount,
        currency: 'USD',
        startDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'active'
    };
    
    simulatedDB.subscriptions.push(subscription);
    
    // Mettre à jour le plan de l'utilisateur
    const user = simulatedDB.users.find(u => u.id === 1);
    if (user) {
        user.plan = plan;
    }
    
    res.json({
        success: true,
        subscription: subscription
    });
});

// 7. Téléchargement de médias
app.post('/api/v1/media/upload', simulateNetworkDelay, (req, res) => {
    const { eventId, type, data, author } = req.body;
    
    // Simuler l'upload
    setTimeout(() => {
        res.json({
            success: true,
            mediaId: `MEDIA-${Date.now()}`,
            eventId,
            type,
            author: author || 'Invité',
            timestamp: new Date().toISOString(),
            url: type === 'photo' 
                ? `https://storage.ceremonia.com/${eventId}/photo-${Date.now()}.jpg`
                : type === 'video'
                ? `https://storage.ceremonia.com/${eventId}/video-${Date.now()}.mp4`
                : null,
            message: 'Contenu uploadé avec succès'
        });
    }, 2000);
});

// 8. Galerie d'événement
app.get('/api/v1/events/:eventId/gallery', simulateNetworkDelay, (req, res) => {
    const { eventId } = req.params;
    
    // Simuler des données de galerie
    const galleryItems = [
        {
            id: 1,
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
            author: 'Marie',
            timestamp: '2024-06-15T14:30:00Z'
        },
        {
            id: 2,
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6',
            author: 'Jean',
            timestamp: '2024-06-15T16:45:00Z'
        },
        {
            id: 3,
            type: 'message',
            text: 'Une journée magnifique !',
            author: 'Claire',
            timestamp: '2024-06-15T20:15:00Z'
        }
    ];
    
    res.json({
        success: true,
        eventId: parseInt(eventId),
        items: galleryItems
    });
});

// 9. Génération de QR Code
app.post('/api/v1/events/:eventId/qrcode', simulateNetworkDelay, simulateAuth, (req, res) => {
    const { eventId } = req.params;
    
    // Simuler la génération de QR code
    const qrCodeData = {
        eventId: parseInt(eventId),
        url: `https://ceremonia.com/event/${eventId}`,
        generatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        qrCode: `data:image/png;base64,${Buffer.from(JSON.stringify(qrCodeData)).toString('base64')}`,
        url: qrCodeData.url
    });
});

// Route de test
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CÉRÉMONIA API Simulation',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 API Simulation en cours d'exécution sur http://localhost:${PORT}`);
    console.log(`📚 Documentation des endpoints:`);
    console.log(`   GET  /api/v1/health - Vérification de l'état`);
    console.log(`   POST /api/v1/auth/login - Connexion utilisateur`);
    console.log(`   POST /api/v1/auth/register - Inscription utilisateur`);
    console.log(`   GET  /api/v1/events - Liste des événements`);
    console.log(`   POST /api/v1/events - Créer un événement`);
    console.log(`   POST /api/v1/payments/process - Traiter un paiement`);
    console.log(`   POST /api/v1/payments/oft/verify - Vérifier un paiement OFT`);
    console.log(`   POST /api/v1/subscriptions/create - Créer un abonnement`);
    console.log(`   POST /api/v1/media/upload - Uploader un média`);
    console.log(`   GET  /api/v1/events/:id/gallery - Galerie d'événement`);
    console.log(`\n🔧 Note: Cette API est une simulation. Toutes les données sont stockées en mémoire.`);
});

module.exports = app; // Pour les tests unitaires ou l'importation dans d'autres modules 