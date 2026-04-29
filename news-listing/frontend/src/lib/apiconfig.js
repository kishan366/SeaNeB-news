import apiClient from '@/lib/apiClient';

export const OTP_PURPOSE = {
    SIGNUP: 0,
    LOGIN: 1,
    BUSINESS_VERIFY: 2,
    USER_UPDATE: 4,
    BUSINESS_UPDATE: 5
};

export const EMAIL_OTP_PURPOSE = {
    USER_SIGNUP: 1,
    BUSINESS_VERIFY: 3,
    USER_UPDATE: 4
};


// Helper to get full image URL from relative path

export const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // Proxied via Next.js rewrites in next.config.mjs
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/images${cleanPath}`;
};


// Helper to handle API requests and standardize errors

async function handleRequest(request) {
    try {
        const response = await request;
        const text = await response.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    } catch (error) {
        // Extract error message from backend response if available
        const errorData = error.data || null;
        let message = error.message || "Something went wrong";

        if (errorData) {
            if (errorData.message) message = errorData.message;
            else if (errorData.error && errorData.error.message) message = errorData.error.message;
            else if (typeof errorData === 'string') message = errorData;
            else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) message = JSON.stringify(errorData);
        }

        if (error.status === 500) {
            console.error('[API] Server Error:', message, errorData);
        }

        const newError = new Error(typeof message === 'object' ? JSON.stringify(message) : message);
        newError.status = error.status;
        newError.data = errorData;
        newError.originalError = error;
        throw newError;
    }
}

export const authAPI = {
    // Send OTP
    sendOtp: (payload) => {
        return handleRequest(apiClient.post('/otp/send-otp', payload));
    },

    // Send Email OTP
    sendEmailOtp: (payload) => {
        // purpose: 1 (User Reg), 3 (Business Reg), 4 (User Update)
        const email = payload.email || payload.identifier;
        return handleRequest(apiClient.post('/auth/email/send-otp', {
            email,
            ...payload,
            purpose: payload.purpose || EMAIL_OTP_PURPOSE.USER_SIGNUP
        }));
    },

    // Verify Email OTP
    verifyEmailOtp: (payload) => {
        const email = payload.email || payload.identifier;
        return handleRequest(apiClient.post('/auth/email/verify-otp', {
            email,
            ...payload,
            purpose: payload.purpose || EMAIL_OTP_PURPOSE.USER_SIGNUP
        }));
    },

    // Verify OTP
    verifyOtp: (payload) => {
        return handleRequest(apiClient.post('/otp/verify-otp', payload));
    },

    // Send OTP for login 
    sendOTP: (phoneNumber, method = 'sms') => {
        return handleRequest(apiClient.post('/otp/send-otp', { identifier: phoneNumber }));
    },

    // Verify OTP 
    verifyOTP: (phoneNumber, otp) => {
        return handleRequest(apiClient.post('/otp/verify-otp', {
            identifier: phoneNumber,
            otp,
            purpose: OTP_PURPOSE.LOGIN
        }));
    },

    // Login
    login: (credentials) => {
        return handleRequest(apiClient.post('/auth/login', credentials));
    },

    // Register
    register: (userData) => {
        return handleRequest(apiClient.post('/auth/register', userData));
    },

    // Logout
    logout: () => {
        return handleRequest(apiClient.post('/logout', { product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY }));
    },

    // SSO Exchange
    ssoExchange: (bridgeToken) => {
        return handleRequest(apiClient.post('/sso/exchange', {
            bridge_token: bridgeToken,
            target_product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
        }));
    },
};

//User API endpoints

export const userAPI = {
    // Get current user profile with full details
    getProfileDetails: () => {
        return handleRequest(apiClient.get('/profile/details'));
    },

    // basic profile
    getProfile: () => {
        return handleRequest(apiClient.get('/profile/me'));
    },


    // Verify SeaNeB ID (Check availability) - Modified to not throw error for conflict check
    verifySeanebId: async (id) => {
        try {
            return await handleRequest(apiClient.post('/seanebid/check', { seaneb_id: id }));
        } catch (err) {
            // Return unavailable instead of throwing to avoid error overlay
            if (err.status === 409 || err.message?.includes('taken') || err.message?.includes('already')) {
                return { available: false, message: err.message };
            }
            throw err;
        }
    },

    // Signup
    signup: (userData) => {
        return handleRequest(apiClient.post('/user/signup', userData));
    },

    // Update Profile
    updateProfile: (userData) => {
        return handleRequest(apiClient.put('/profile/update', userData));
    },
    // Update Profile Photo
    updateProfilePhoto: (formData) => {
        return handleRequest(apiClient.post('/profile/update-photo', formData));
    },
};

export const locationAPI = {
    // Search cities
    getCities: (query) => {
        const input = query || '';
        return handleRequest(apiClient.get(`/autocomplete-cities?input=${input}`));
    },
};

export const productAPI = {
    // Get all products
    getProducts: () => {
        return handleRequest(apiClient.get('/products', {
            params: {
                product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
            }
        }));
    },
};

export const categoryAPI = {
    // Get active categories for a specific product
    getCategories: (productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY) => {
        return handleRequest(apiClient.post('/category/list', {
            product_key: productKey
        }));
    },
};

export const businessAPI = {
    // Create business
    create: (payload) => {
        return handleRequest(apiClient.post('/business/create', { ...payload, product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY }, {
            headers: {
                'x-product-key': process.env.NEXT_PUBLIC_PRODUCT_KEY
            }
        }));
    },

    // Search businesses
    search: (query) => {
        return handleRequest(apiClient.get('/business/autocomplete', {
            params: {
                input: query,
                product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
            },
            headers: {
                'x-product-key': process.env.NEXT_PUBLIC_PRODUCT_KEY
            }
        }));
    },
};

export const paymentAPI = {
    getOnboardingChargePreview: async (branchId) => {
        // Dummy Data implementation since live API is not currently working
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        description: "Onboarding Charges",
                        base_amount: 100,
                        gst_percentage: 18,
                        cgst_amount: 9,
                        sgst_amount: 9,
                        igst_amount: 0,
                        total_amount: 118
                    }
                });
            }, 600);
        });
    },

    payNow: (payload) => {
        return handleRequest(apiClient.post('/onboarding/pay-now', payload, {
            headers: {
                'x-product-key': process.env.NEXT_PUBLIC_PRODUCT_KEY
            }
        }));
    },

    cancelOnboarding: (payload) => {
        // payload should contain branch_id
        return handleRequest(apiClient.post('/onboarding/cancel', payload));
    },

    getInvoice: (orderId) => {
        return handleRequest(apiClient.get(`/payment/invoice/${orderId}`));
    },

    getInvoicePdfUrl: (invoiceId) => {
        return `/api/v1/invoice/${invoiceId}/pdf`;
    }
};

export const newsAPI = {
    // Get public news feed (no auth required)
    getPublicFeed: (params = {}) => {
        const queryParams = {};
        if (params.page) queryParams.page = params.page;
        if (params.limit) queryParams.limit = params.limit;
        if (params.category) queryParams.category = params.category;
        return handleRequest(apiClient.get('/news/public-feed', queryParams));
    },

    // Toggle short-form Like 
    toggleLike: (articleId) => {
        return handleRequest(apiClient.post(`/news/${articleId}/like`));
    },

    // Add Comment on an article
    addComment: (articleId, commentData) => {
        return handleRequest(apiClient.post(`/news/${articleId}/comment`, commentData));
    },

    // Get Comments on an article
    getComments: (articleId) => {
        return handleRequest(apiClient.get(`/news/${articleId}/comments`));
    },
};

const api = {
    auth: authAPI,
    user: userAPI,
    location: locationAPI,
    product: productAPI,
    category: categoryAPI,
    business: businessAPI,
    payment: paymentAPI,
    news: newsAPI,
};

export default api;
