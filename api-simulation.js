// api-simulation.js - API Backend CÉRÉMONIA
// Service complet de gestion d'événements avec paiements et médias

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const API_KEY = 'CEREMONIA_API_KEY_2024_SECURE';

app.use(cors());
app.use(bodyParser.json());

// Middleware d'authentification API
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Clé API invalide ou manquante',
            code: 'API_KEY_INVALID'
        });
    }
    
    next();
};

// Middleware de validation
const validateRequest = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Corps de requête manquant',
                code: 'MISSING_BODY'
            });
        }
    }
    next();
};

// Base de données
const database = {
    users: [
        { 
            id: 1, 
            email: 'client@ceremonia.com', 
            name: 'Client Premium', 
            password: '$2b$10$KjHxY.ZT7Q6F8N9sLp5.9uJtVwXrA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q', 
            plan: 'premium',
            phone: '+33612345678',
            company: 'Événements Prestige SARL',
            address: '123 Avenue des Champs-Élysées, 75008 Paris',
            taxId: 'FR12345678901',
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-03-20T09:15:22Z',
            status: 'active'
        }
    ],
    events: [
        { 
            id: 1, 
            name: 'Mariage Sophie & Thomas', 
            type: 'wedding', 
            date: '2024-06-15', 
            time: '14:00',
            userId: 1, 
            plan: 'premium',
            location: 'Château de Versailles, France',
            coordinates: { lat: 48.8049, lng: 2.1204 },
            theme: 'royal-gold',
            guests: 150,
            budget: 35000,
            currency: 'USD',
            status: 'confirmed',
            confirmedAt: '2024-01-20T11:45:30Z',
            accessCode: 'WED2024VIP'
        },
        { 
            id: 2, 
            name: 'Anniversaire Professionnel TechCorp', 
            type: 'corporate', 
            date: '2024-07-20', 
            time: '19:00',
            userId: 1, 
            plan: 'business',
            location: 'Paris Marriott Opera Ambassador Hotel',
            coordinates: { lat: 48.8721, lng: 2.3320 },
            theme: 'modern-blue',
            guests: 80,
            budget: 12000,
            currency: 'USD',
            status: 'confirmed',
            confirmedAt: '2024-02-15T16:20:45Z',
            accessCode: 'CORP2024EXEC'
        },
        { 
            id: 3, 
            name: 'Conférence Innovation Digitale', 
            type: 'conference', 
            date: '2024-09-10', 
            time: '09:00',
            userId: 1, 
            plan: 'enterprise',
            location: 'Palais des Congrès, Paris',
            coordinates: { lat: 48.8765, lng: 2.2846 },
            theme: 'tech-purple',
            guests: 300,
            budget: 50000,
            currency: 'USD',
            status: 'draft',
            accessCode: 'CONF2024INNO'
        }
    ],
    payments: [
        {
            id: 1,
            transactionId: 'PAY-20240120-789012345678',
            reference: 'INV-2024-001',
            method: 'credit_card',
            provider: 'stripe',
            amount: 299.99,
            currency: 'USD',
            status: 'succeeded',
            userId: 1,
            eventId: 1,
            timestamp: '2024-01-20T14:22:10Z',
            cardLast4: '4242',
            cardBrand: 'visa',
            cardCountry: 'US',
            description: 'Abonnement Premium - Mariage Sophie & Thomas',
            receiptUrl: 'https://receipts.ceremonia.com/PAY-20240120-789012345678',
            metadata: {
                subscriptionId: 'SUB-PREM-2024-001',
                plan: 'premium',
                billingCycle: 'annual'
            }
        },
        {
            id: 2,
            transactionId: 'PAY-20240215-123456789012',
            reference: 'INV-2024-002',
            method: 'bank_transfer',
            provider: 'transferwise',
            amount: 1200.00,
            currency: 'USD',
            status: 'completed',
            userId: 1,
            eventId: 2,
            timestamp: '2024-02-15T11:30:45Z',
            description: 'Acompte événement corporate - TechCorp',
            receiptUrl: 'https://receipts.ceremonia.com/PAY-20240215-123456789012',
            metadata: {
                deposit: true,
                percentage: 10,
                remaining: 10800.00
            }
        }
    ],
    subscriptions: [
        {
            id: 1,
            subscriptionId: 'SUB-PREM-2024-001',
            userId: 1,
            plan: 'premium',
            name: 'Plan Premium Événements',
            amount: 299.99,
            currency: 'USD',
            billingCycle: 'annual',
            startDate: '2024-01-20T00:00:00Z',
            expiryDate: '2025-01-20T00:00:00Z',
            nextBillingDate: '2025-01-20T00:00:00Z',
            status: 'active',
            autoRenew: true,
            paymentMethod: 'card_ending_in_4242',
            features: [
                'Événements illimités',
                '10,000 photos maximum',
                '100 vidéos maximum',
                'Support prioritaire',
                'Analytics avancées',
                'QR Codes personnalisés'
            ],
            limits: {
                events: -1,
                photos: 10000,
                videos: 100,
                storage: 500
            }
        }
    ],
    invoices: [
        {
            id: 1,
            invoiceId: 'INV-2024-001',
            subscriptionId: 'SUB-PREM-2024-001',
            userId: 1,
            amount: 299.99,
            currency: 'USD',
            status: 'paid',
            issuedDate: '2024-01-20T00:00:00Z',
            dueDate: '2024-01-20T00:00:00Z',
            paidDate: '2024-01-20T14:22:10Z',
            items: [
                {
                    description: 'Abonnement Premium CÉRÉMONIA (Annuel)',
                    quantity: 1,
                    unitPrice: 299.99,
                    total: 299.99
                }
            ],
            tax: 0.00,
            total: 299.99,
            pdfUrl: 'https://invoices.ceremonia.com/INV-2024-001.pdf'
        }
    ],
    qrCodes: [
        {
            id: 1,
            eventId: 1,
            code: 'WED2024VIP',
            type: 'event_access',
            url: 'https://ceremonia.com/e/WED2024VIP',
            shortUrl: 'https://ce.re/WED2024',
            qrImage: 'https://qr.ceremonia.com/WED2024VIP.png',
            scans: 47,
            createdAt: '2024-01-25T10:15:30Z',
            expiresAt: '2024-06-30T23:59:59Z',
            status: 'active'
        }
    ]
};

// 1. Authentification
app.post('/api/v1/auth/login', validateRequest, (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email et mot de passe requis',
            code: 'VALIDATION_ERROR'
        });
    }
    
    const user = database.users.find(u => u.email === email);
    
    if (user) {
        // En production, comparer avec bcrypt
        const passwordMatch = password === 'ceremonia2024'; // Simplifié pour la simulation
        
        if (passwordMatch) {
            // Générer un token JWT simulé
            const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({
                userId: user.id,
                email: user.email,
                plan: user.plan,
                exp: Math.floor(Date.now() / 1000) + 86400
            })).toString('base64')}.simulated_signature`;
            
            // Mettre à jour la dernière connexion
            user.lastLogin = new Date().toISOString();
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        company: user.company,
                        phone: user.phone
                    },
                    expiresIn: 86400
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Mot de passe incorrect',
                code: 'INVALID_CREDENTIALS'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            error: 'Aucun compte trouvé avec cet email',
            code: 'USER_NOT_FOUND'
        });
    }
});

app.post('/api/v1/auth/register', validateRequest, (req, res) => {
    const { email, password, name, phone, company } = req.body;
    
    const requiredFields = ['email', 'password', 'name'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
                code: 'MISSING_FIELD'
            });
        }
    }
    
    if (database.users.find(u => u.email === email)) {
        return res.status(409).json({
            success: false,
            error: 'Un compte existe déjà avec cette adresse email',
            code: 'EMAIL_EXISTS'
        });
    }
    
    const newUser = {
        id: database.users.length + 1,
        email,
        password: `$2b$10$${crypto.randomBytes(16).toString('hex')}`, // Hash simulé
        name,
        phone: phone || '',
        company: company || '',
        plan: 'free',
        address: '',
        taxId: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'active'
    };
    
    database.users.push(newUser);
    
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({
        userId: newUser.id,
        email: newUser.email,
        plan: newUser.plan,
        exp: Math.floor(Date.now() / 1000) + 86400
    })).toString('base64')}.simulated_signature`;
    
    res.status(201).json({
        success: true,
        data: {
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                plan: newUser.plan,
                company: newUser.company,
                phone: newUser.phone
            },
            message: 'Compte créé avec succès'
        }
    });
});

// 2. Gestion des événements
app.get('/api/v1/events', authenticateAPI, (req, res) => {
    const userId = parseInt(req.query.userId) || 1;
    const status = req.query.status;
    
    let userEvents = database.events.filter(event => event.userId === userId);
    
    if (status) {
        userEvents = userEvents.filter(event => event.status === status);
    }
    
    res.json({
        success: true,
        data: {
            events: userEvents,
            count: userEvents.length,
            totalBudget: userEvents.reduce((sum, event) => sum + event.budget, 0),
            currency: 'USD'
        }
    });
});

app.post('/api/v1/events', authenticateAPI, validateRequest, (req, res) => {
    const { name, type, date, time, location, theme, guests, budget } = req.body;
    const userId = 1; // Récupéré du token en production
    
    const requiredFields = ['name', 'type', 'date'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
                code: 'MISSING_FIELD'
            });
        }
    }
    
    const user = database.users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Utilisateur non trouvé',
            code: 'USER_NOT_FOUND'
        });
    }
    
    // Vérifier les limites du plan
    if (user.plan === 'free') {
        const userEvents = database.events.filter(e => e.userId === userId);
        if (userEvents.length >= 1) {
            return res.status(403).json({
                success: false,
                error: 'Limite d\'événements atteinte pour le plan gratuit. Veuillez mettre à niveau.',
                code: 'PLAN_LIMIT_REACHED'
            });
        }
    }
    
    const newEvent = {
        id: database.events.length + 1,
        name,
        type,
        date,
        time: time || '12:00',
        userId,
        plan: user.plan,
        location: location || '',
        coordinates: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
        theme: theme || 'classic',
        guests: guests || 50,
        budget: budget || 5000,
        currency: 'USD',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCode: `${type.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`
    };
    
    database.events.push(newEvent);
    
    res.status(201).json({
        success: true,
        data: {
            event: newEvent,
            message: 'Événement créé avec succès'
        }
    });
});

// 3. Paiements et transactions
app.post('/api/v1/payments/process', authenticateAPI, validateRequest, (req, res) => {
    const { method, amount, currency, cardDetails, eventId, description } = req.body;
    const userId = 1;
    
    const requiredFields = ['method', 'amount'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
                code: 'MISSING_FIELD'
            });
        }
    }
    
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Le montant doit être supérieur à 0',
            code: 'INVALID_AMOUNT'
        });
    }
    
    // Validation de la carte simulée
    if (method === 'credit_card' && cardDetails) {
        const { number, expMonth, expYear, cvc } = cardDetails;
        
        // Simulation de validation
        if (!number || !expMonth || !expYear || !cvc) {
            return res.status(400).json({
                success: false,
                error: 'Informations de carte incomplètes',
                code: 'INVALID_CARD_DETAILS'
            });
        }
        
        if (expMonth < 1 || expMonth > 12) {
            return res.status(400).json({
                success: false,
                error: 'Mois d\'expiration invalide',
                code: 'INVALID_EXPIRY_MONTH'
            });
        }
        
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            return res.status(400).json({
                success: false,
                error: 'Carte expirée',
                code: 'CARD_EXPIRED'
            });
        }
    }
    
    // Simulation de taux de succès (95%)
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
        const transactionId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        const reference = `INV-${new Date().getFullYear()}-${(database.payments.length + 1).toString().padStart(3, '0')}`;
        
        const paymentRecord = {
            id: database.payments.length + 1,
            transactionId,
            reference,
            method,
            provider: method === 'credit_card' ? 'stripe' : 
                     method === 'paypal' ? 'paypal' : 
                     method === 'bank_transfer' ? 'transferwise' : 'manual',
            amount: parseFloat(amount),
            currency: currency || 'USD',
            status: 'succeeded',
            userId,
            eventId: eventId || null,
            timestamp: new Date().toISOString(),
            cardLast4: method === 'credit_card' && cardDetails ? cardDetails.number.slice(-4) : null,
            cardBrand: method === 'credit_card' && cardDetails ? 
                      (cardDetails.number.startsWith('4') ? 'visa' : 
                       cardDetails.number.startsWith('5') ? 'mastercard' : 
                       cardDetails.number.startsWith('3') ? 'amex' : 'other') : null,
            cardCountry: 'US',
            description: description || 'Paiement CÉRÉMONIA',
            receiptUrl: `https://receipts.ceremonia.com/${transactionId}`,
            metadata: {
                ipAddress: req.ip || '192.168.1.1',
                userAgent: req.headers['user-agent'] || 'Unknown',
                riskScore: Math.floor(Math.random() * 20) // Score de risque simulé
            }
        };
        
        database.payments.push(paymentRecord);
        
        // Créer une facture associée
        const invoice = {
            id: database.invoices.length + 1,
            invoiceId: reference,
            paymentId: paymentRecord.id,
            userId,
            amount: paymentRecord.amount,
            currency: paymentRecord.currency,
            status: 'paid',
            issuedDate: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            paidDate: new Date().toISOString(),
            items: [{
                description: paymentRecord.description,
                quantity: 1,
                unitPrice: paymentRecord.amount,
                total: paymentRecord.amount
            }],
            tax: 0.00,
            total: paymentRecord.amount,
            pdfUrl: `https://invoices.ceremonia.com/${reference}.pdf`
        };
        
        database.invoices.push(invoice);
        
        res.json({
            success: true,
            data: {
                transactionId,
                reference,
                amount: paymentRecord.amount,
                currency: paymentRecord.currency,
                status: 'succeeded',
                timestamp: paymentRecord.timestamp,
                receiptUrl: paymentRecord.receiptUrl,
                invoiceUrl: invoice.pdfUrl,
                nextSteps: [
                    'Votre paiement a été traité avec succès',
                    'Un reçu a été envoyé à votre email',
                    'Votre service est maintenant actif'
                ]
            }
        });
    } else {
        res.status(402).json({
            success: false,
            error: 'Paiement refusé. Veuillez vérifier vos informations ou contacter votre banque.',
            code: 'PAYMENT_DECLINED',
            details: {
                reason: 'Fonds insuffisants ou limite de carte dépassée',
                suggestedAction: 'Vérifier le solde de votre compte ou utiliser un autre moyen de paiement'
            }
        });
    }
});

// 4. Vérification des transactions
app.post('/api/v1/payments/verify', authenticateAPI, validateRequest, (req, res) => {
    const { transactionId } = req.body;
    
    if (!transactionId) {
        return res.status(400).json({
            success: false,
            error: 'transactionId est requis',
            code: 'MISSING_TRANSACTION_ID'
        });
    }
    
    const payment = database.payments.find(p => p.transactionId === transactionId);
    
    if (!payment) {
        return res.status(404).json({
            success: false,
            error: 'Transaction non trouvée',
            code: 'TRANSACTION_NOT_FOUND'
        });
    }
    
    res.json({
        success: true,
        data: {
            transactionId: payment.transactionId,
            reference: payment.reference,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            timestamp: payment.timestamp,
            verified: payment.status === 'succeeded' || payment.status === 'completed',
            cardLast4: payment.cardLast4,
            cardBrand: payment.cardBrand,
            receiptUrl: payment.receiptUrl
        }
    });
});

// 5. Abonnements
app.post('/api/v1/subscriptions/create', authenticateAPI, validateRequest, (req, res) => {
    const { plan, billingCycle, paymentMethodId } = req.body;
    const userId = 1;
    
    const requiredFields = ['plan', 'billingCycle'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
                code: 'MISSING_FIELD'
            });
        }
    }
    
    const validPlans = ['free', 'basic', 'premium', 'business', 'enterprise'];
    if (!validPlans.includes(plan)) {
        return res.status(400).json({
            success: false,
            error: 'Plan invalide',
            code: 'INVALID_PLAN',
            validPlans
        });
    }
    
    const validCycles = ['monthly', 'annual'];
    if (!validCycles.includes(billingCycle)) {
        return res.status(400).json({
            success: false,
            error: 'Cycle de facturation invalide',
            code: 'INVALID_BILLING_CYCLE',
            validCycles
        });
    }
    
    const user = database.users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Utilisateur non trouvé',
            code: 'USER_NOT_FOUND'
        });
    }
    
    // Prix selon le plan et le cycle
    const prices = {
        basic: { monthly: 29.99, annual: 299.99 },
        premium: { monthly: 79.99, annual: 799.99 },
        business: { monthly: 199.99, annual: 1999.99 },
        enterprise: { monthly: 499.99, annual: 4999.99 }
    };
    
    const amount = prices[plan] ? prices[plan][billingCycle] : 0;
    
    const subscriptionId = `SUB-${plan.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${(database.subscriptions.length + 1).toString().padStart(3, '0')}`;
    
    // Dates
    const startDate = new Date().toISOString();
    const expiryDate = new Date();
    if (billingCycle === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    const subscription = {
        id: database.subscriptions.length + 1,
        subscriptionId,
        userId,
        plan,
        name: `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} CÉRÉMONIA`,
        amount,
        currency: 'USD',
        billingCycle,
        startDate,
        expiryDate: expiryDate.toISOString(),
        nextBillingDate: expiryDate.toISOString(),
        status: 'active',
        autoRenew: true,
        paymentMethod: paymentMethodId || 'card_ending_in_4242',
        features: getPlanFeatures(plan),
        limits: getPlanLimits(plan),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    database.subscriptions.push(subscription);
    
    // Mettre à jour le plan de l'utilisateur
    user.plan = plan;
    user.updatedAt = new Date().toISOString();
    
    // Créer un paiement pour l'abonnement
    const transactionId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    
    const paymentRecord = {
        id: database.payments.length + 1,
        transactionId,
        reference: `INV-${new Date().getFullYear()}-${(database.invoices.length + 1).toString().padStart(3, '0')}`,
        method: 'credit_card',
        provider: 'stripe',
        amount,
        currency: 'USD',
        status: 'succeeded',
        userId,
        timestamp: new Date().toISOString(),
        cardLast4: '4242',
        cardBrand: 'visa',
        cardCountry: 'US',
        description: `Abonnement ${plan} - ${billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}`,
        receiptUrl: `https://receipts.ceremonia.com/${transactionId}`,
        metadata: {
            subscriptionId,
            plan,
            billingCycle
        }
    };
    
    database.payments.push(paymentRecord);
    
    res.status(201).json({
        success: true,
        data: {
            subscription,
            payment: {
                transactionId: paymentRecord.transactionId,
                amount: paymentRecord.amount,
                currency: paymentRecord.currency,
                status: paymentRecord.status
            },
            message: 'Abonnement activé avec succès'
        }
    });
});

// Fonctions helper pour les plans
function getPlanFeatures(plan) {
    const features = {
        free: [
            '1 événement maximum',
            '100 photos maximum',
            'Galerie basique',
            'Support par email'
        ],
        basic: [
            '5 événements maximum',
            '1,000 photos maximum',
            'Galerie personnalisée',
            'Support prioritaire',
            'QR Codes standard'
        ],
        premium: [
            'Événements illimités',
            '10,000 photos maximum',
            'Galerie premium',
            'Support 24/7',
            'QR Codes personnalisés',
            'Analytics basiques'
        ],
        business: [
            'Événements illimités',
            '50,000 photos maximum',
            'Galerie entreprise',
            'Support dédié',
            'QR Codes avancés',
            'Analytics complètes',
            'API d\'intégration',
            'Branding personnalisé'
        ],
        enterprise: [
            'Événements illimités',
            'Stockage illimité',
            'Galerie sur mesure',
            'Manager de compte',
            'QR Codes enterprise',
            'Analytics en temps réel',
            'API complète',
            'Branding complet',
            'SLA 99.9%',
            'Formation équipe'
        ]
    };
    
    return features[plan] || features.free;
}

function getPlanLimits(plan) {
    const limits = {
        free: { events: 1, photos: 100, videos: 10, storage: 1, guests: 50 },
        basic: { events: 5, photos: 1000, videos: 50, storage: 10, guests: 200 },
        premium: { events: -1, photos: 10000, videos: 200, storage: 50, guests: 500 },
        business: { events: -1, photos: 50000, videos: 500, storage: 200, guests: 1000 },
        enterprise: { events: -1, photos: -1, videos: -1, storage: -1, guests: -1 }
    };
    
    return limits[plan] || limits.free;
}

// 6. QR Codes
app.post('/api/v1/events/:eventId/qrcode', authenticateAPI, (req, res) => {
    const { eventId } = req.params;
    const { type, customCode } = req.body;
    const userId = 1;
    
    const event = database.events.find(e => e.id === parseInt(eventId) && e.userId === userId);
    
    if (!event) {
        return res.status(404).json({
            success: false,
            error: 'Événement non trouvé',
            code: 'EVENT_NOT_FOUND'
        });
    }
    
    // Vérifier si l'utilisateur peut créer des QR Codes
    if (event.plan === 'free') {
        return res.status(403).json({
            success: false,
            error: 'La génération de QR Code n\'est disponible que pour les plans payants',
            code: 'PLAN_FEATURE_LIMITED'
        });
    }
    
    // Vérifier si un QR Code existe déjà
    const existingQrCode = database.qrCodes.find(qr => qr.eventId === parseInt(eventId));
    
    if (existingQrCode && !req.query.regenerate) {
        return res.json({
            success: true,
            data: existingQrCode,
            message: 'QR Code existant récupéré'
        });
    }
    
    // Générer un nouveau QR Code
    const code = customCode || `${event.type.slice(0, 3).toUpperCase()}${eventId}${Date.now().toString().slice(-4)}`;
    const shortCode = `CE${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    const qrCode = {
        id: database.qrCodes.length + 1,
        eventId: parseInt(eventId),
        code,
        type: type || 'event_access',
        url: `https://ceremonia.com/e/${code}`,
        shortUrl: `https://ce.re/${shortCode}`,
        qrImage: `https://qr.ceremonia.com/v1/generate?data=${encodeURIComponent(`https://ceremonia.com/e/${code}`)}&size=400&format=png`,
        dynamicUrl: `https://api.ceremonia.com/qr/${code}/redirect`,
        scans: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        status: 'active',
        metadata: {
            eventName: event.name,
            eventDate: event.date,
            plan: event.plan,
            generatedBy: userId
        }
    };
    
    // Si un QR Code existait déjà, le remplacer
    if (existingQrCode) {
        const index = database.qrCodes.findIndex(qr => qr.id === existingQrCode.id);
        database.qrCodes[index] = qrCode;
    } else {
        database.qrCodes.push(qrCode);
    }
    
    res.status(201).json({
        success: true,
        data: qrCode,
        message: 'QR Code généré avec succès',
        usageInstructions: [
            `Scannez le QR Code pour accéder à l'événement: ${event.name}`,
            `URL raccourcie: ${qrCode.shortUrl}`,
            `Code d'accès: ${code}`,
            `Expire le: ${new Date(qrCode.expiresAt).toLocaleDateString('fr-FR')}`
        ]
    });
});

// 7. Galerie et médias
app.post('/api/v1/media/upload', authenticateAPI, validateRequest, (req, res) => {
    const { eventId, type, fileName, fileSize, author, metadata } = req.body;
    const userId = 1;
    
    const requiredFields = ['eventId', 'type', 'fileName'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `Le champ ${field} est requis`,
                code: 'MISSING_FIELD'
            });
        }
    }
    
    const event = database.events.find(e => e.id === parseInt(eventId));
    if (!event) {
        return res.status(404).json({
            success: false,
            error: 'Événement non trouvé',
            code: 'EVENT_NOT_FOUND'
        });
    }
    
    // Vérifier les limites de stockage selon le plan
    const userSubscription = database.subscriptions.find(s => s.userId === userId);
    if (userSubscription) {
        const planLimits = getPlanLimits(userSubscription.plan);
        
        if (type === 'photo' && planLimits.photos > 0) {
            const photoCount = database.media.filter(m => m.eventId === parseInt(eventId) && m.type === 'photo').length;
            if (photoCount >= planLimits.photos) {
                return res.status(403).json({
                    success: false,
                    error: `Limite de photos atteinte pour votre plan (${planLimits.photos})`,
                    code: 'STORAGE_LIMIT_REACHED',
                    upgradeUrl: 'https://ceremonia.com/pricing'
                });
            }
        }
    }
    
    const mediaId = `MEDIA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    const mediaItem = {
        id: database.media.length + 1,
        mediaId,
        eventId: parseInt(eventId),
        userId,
        type,
        fileName,
        fileSize: fileSize || 1024 * 1024, // 1MB par défaut
        fileType: type === 'photo' ? 'image' : 
                  type === 'video' ? 'video' : 
                  type === 'audio' ? 'audio' : 'document',
        mimeType: type === 'photo' ? 'image/jpeg' : 
                  type === 'video' ? 'video/mp4' : 
                  'application/octet-stream',
        url: `https://storage.ceremonia.com/events/${eventId}/media/${mediaId}.${fileExtension}`,
        thumbnailUrl: `https://storage.ceremonia.com/events/${eventId}/thumbnails/${mediaId}_thumb.jpg`,
        author: author || 'Invité',
        uploadedAt: new Date().toISOString(),
        status: 'processed',
        metadata: metadata || {},
        permissions: {
            view: true,
            download: true,
            share: true
        }
    };
    
    database.media.push(mediaItem);
    
    // Simuler un délai de traitement
    setTimeout(() => {
        res.json({
            success: true,
            data: {
                media: mediaItem,
                storageInfo: {
                    used: `${database.media.length} fichiers`,
                    eventId: eventId,
                    remaining: userSubscription ? `Limite: ${getPlanLimits(userSubscription.plan).photos} photos` : 'Illimité'
                }
            },
            message: 'Média uploadé et traité avec succès'
        });
    }, 1500);
});

// 8. Dashboard et statistiques
app.get('/api/v1/dashboard', authenticateAPI, (req, res) => {
    const userId = 1;
    
    const userEvents = database.events.filter(e => e.userId === userId);
    const userPayments = database.payments.filter(p => p.userId === userId);
    const userSubscription = database.subscriptions.find(s => s.userId === userId);
    const userMedia = database.media.filter(m => m.userId === userId);
    
    const totalSpent = userPayments
        .filter(p => p.status === 'succeeded' || p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const upcomingEvents = userEvents.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        return eventDate >= today && e.status === 'confirmed';
    });
    
    const recentActivity = [
        ...userPayments.slice(-3).map(p => ({
            type: 'payment',
            description: p.description,
            amount: p.amount,
            currency: p.currency,
            timestamp: p.timestamp,
            status: p.status
        })),
        ...userEvents.slice(-2).map(e => ({
            type: 'event',
            description: e.name,
            date: e.date,
            timestamp: e.createdAt,
            status: e.status
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        success: true,
        data: {
            user: database.users.find(u => u.id === userId),
            summary: {
                totalEvents: userEvents.length,
                activeEvents: userEvents.filter(e => e.status === 'confirmed').length,
                totalSpent,
                currency: 'USD',
                mediaCount: userMedia.length,
                qrCodes: database.qrCodes.filter(qr => userEvents.some(e => e.id === qr.eventId)).length
            },
            subscription: userSubscription,
            upcomingEvents,
            recentActivity,
            quickActions: [
                { label: 'Créer un événement', endpoint: '/api/v1/events', method: 'POST' },
                { label: 'Générer QR Code', endpoint: '/api/v1/events/:id/qrcode', method: 'POST' },
                { label: 'Voir les factures', endpoint: '/api/v1/invoices', method: 'GET' },
                { label: 'Mettre à niveau', endpoint: '/api/v1/subscriptions/upgrade', method: 'POST' }
            ]
        }
    });
});

// 9. Route de santé
app.get('/api/v1/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        data: {
            service: 'CÉRÉMONIA API',
            version: '1.0.0',
            environment: 'production',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            memory: {
                used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
            },
            database: {
                users: database.users.length,
                events: database.events.length,
                payments: database.payments.length,
                media: database.media.length
            },
            endpoints: [
                { path: '/api/v1/auth/login', method: 'POST', description: 'Authentification utilisateur' },
                { path: '/api/v1/auth/register', method: 'POST', description: 'Inscription utilisateur' },
                { path: '/api/v1/events', method: 'GET,POST', description: 'Gestion des événements' },
                { path: '/api/v1/payments/process', method: 'POST', description: 'Traitement des paiements' },
                { path: '/api/v1/payments/verify', method: 'POST', description: 'Vérification des transactions' },
                { path: '/api/v1/subscriptions/create', method: 'POST', description: 'Gestion des abonnements' },
                { path: '/api/v1/events/:id/qrcode', method: 'POST', description: 'Génération de QR Codes' },
                { path: '/api/v1/media/upload', method: 'POST', description: 'Upload de médias' },
                { path: '/api/v1/dashboard', method: 'GET', description: 'Tableau de bord utilisateur' }
            ]
        }
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur API CÉRÉMONIA démarré sur le port ${PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/auth/login`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/auth/register`);
    console.log(`   GET   http://localhost:${PORT}/api/v1/events`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/events`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/payments/process`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/payments/verify`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/subscriptions/create`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/events/:id/qrcode`);
    console.log(`   POST  http://localhost:${PORT}/api/v1/media/upload`);
    console.log(`   GET   http://localhost:${PORT}/api/v1/dashboard`);
    console.log(`   GET   http://localhost:${PORT}/api/v1/health`);
    console.log(`\n🔐 Clé API requise pour les endpoints protégés: CEREMONIA_API_KEY_2024_SECURE`);
    console.log(`💡 Exemple d'en-tête: { "x-api-key": "CEREMONIA_API_KEY_2024_SECURE" }`);
    console.log(`💰 Tous les paiements sont en USD`);
    console.log(`📱 API prête pour l'intégration frontend`);
});

module.exports = app;
