// Centralized API Layer for all backend requests
import apiClient from '@/lib/apiClient';

export const OTP_PURPOSE = {
    SIGNUP: 0,
    LOGIN: 0,
    BUSINESS_VERIFY: 2,
    USER_UPDATE: 4,
    BUSINESS_UPDATE: 5
};

export const EMAIL_OTP_PURPOSE = {
    USER_SIGNUP: 1,
    BUSINESS_VERIFY: 3
};

export const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // Proxied via Next.js rewrites in next.config.mjs
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/images${cleanPath}`;
};

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


 // Auth API endpoints
 
export const authAPI = {
    // Send OTP
    sendOtp: (payload) => {
        return handleRequest(apiClient.post('/otp/send-otp', payload));
    },

    // Send Email OTP
    sendEmailOtp: (payload) => {
        // purpose: 1 (User Reg), 3 (Business Reg)
        return handleRequest(apiClient.post('/auth/email/send-otp', {
            ...payload,
            purpose: payload.purpose || EMAIL_OTP_PURPOSE.USER_SIGNUP
        }));
    },

    // Verify Email OTP
    verifyEmailOtp: (payload) => {
        return handleRequest(apiClient.post('/auth/email/verify-otp', {
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

let businessesCache = null;

// User API endpoints
export const userAPI = {
    // Get current user profile
    getProfile: () => {
        return handleRequest(apiClient.get('/profile/me'));
    },

    // Update user profile info
    updateProfile: (userData) => {
        return handleRequest(apiClient.post('/profile/update', userData));
    },

    // Update user profile photo
    updateProfilePhoto: (formData) => {
        return handleRequest(apiClient.request('/profile/update-photo', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': null 
            }
        }));
    },


    // Verify SeaNeB ID (Check availability)
    verifySeanebId: (id) => {
        return handleRequest(apiClient.post('/seanebid/check', { seaneb_id: id }));
    },

    // Get all businesses and branches for the user
    getBusinesses: (forceRefresh = false) => {
        if (businessesCache && !forceRefresh) return businessesCache;

        businessesCache = (async () => {
            try {
                return await handleRequest(apiClient.get('/profile/businesses', {}, {
                    headers: {
                        'x-product-key': process.env.NEXT_PUBLIC_PRODUCT_KEY
                    }
                }));
            } catch (err) {
                businessesCache = null; 
                throw err;
            }
        })();

        return businessesCache;
    },

    // Signup
    signup: (userData) => {
        return handleRequest(apiClient.post('/user/signup', userData));
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
    // Get all products%%%%
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
        const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;
        let finalPayload = payload;
        
        if (payload instanceof FormData) {
            if (!payload.has('product_key')) {
                payload.append('product_key', productKey);
            }
        } else {
            finalPayload = { ...payload, product_key: productKey };
        }

        return handleRequest(apiClient.post('/business/create', finalPayload, {
            headers: {
                'x-product-key': productKey
            }
        }));
    },

    // Search businesses
    search: (query) => {
        return handleRequest(apiClient.get(`/business/autocomplete?input=${encodeURIComponent(query)}&product_key=${process.env.NEXT_PUBLIC_PRODUCT_KEY}`));
    },

    update: (formData) => {
        return handleRequest(apiClient.put('/business/update', formData));
    },

    // Complete Media-House Profile
    updateProfileCompletion: (formData) => {
        return handleRequest(apiClient.post('/branch/news/complete-profile', formData));
    },
};

export const paymentAPI = {
    getOnboardingChargePreview: () => {
        return handleRequest(apiClient.get('/payment/onboarding-charge-preview'));
    },
    payNow: (payload) => {
        // payload should contain branch_id
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

    getInvoiceByBranch: (branchId) => {
        return handleRequest(apiClient.get(`/invoice/branch/${branchId}`));
    },

    getInvoicePdfUrl: (invoiceId) => {
        return `/api/v1/invoice/${invoiceId}/pdf`;
    },

    downloadInvoicePdf: (invoiceId) => {
        return apiClient.get(`/invoice/${invoiceId}/pdf`);
    }
};

export const galleryAPI = {
    // Upload gallery images
    upload: (branchId, formData) => {
        const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;
        return handleRequest(apiClient.post(`/business/gallery/${branchId}?product_key=${productKey}`, formData));
    },
    // Fetch gallery images
    getGallery: (branchId) => {
        return handleRequest(apiClient.get(`/business/gallery/${branchId}`, {
            product_key: process.env.NEXT_PUBLIC_PRODUCT_KEY
        }));
    },
    // Update image status
    updateStatus: (galleryId, isActive) => {
        const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;
        return handleRequest(apiClient.put(`/business/gallery/${galleryId}?product_key=${productKey}`, { is_active: isActive }));
    },
    // Delete gallery image
    delete: (galleryId) => {
        const productKey = process.env.NEXT_PUBLIC_PRODUCT_KEY;
        return handleRequest(apiClient.delete(`/business/gallery/${galleryId}?product_key=${productKey}`));
    }
};

export const staffAPI = {
    // Get current media house user info
    getMe: () => {
        return handleRequest(apiClient.get('/news/media-house/me'));
    },

    // Add staff member
    add: (payload) => {
        return handleRequest(apiClient.post('/news/media-house/staff/add', payload));
    },

    // List staff members
    list: () => {
        return handleRequest(apiClient.get('/news/media-house/members'));
    },

    // Remove staff member
    remove: (centralUserId) => {
        return handleRequest(apiClient.request('/news/media-house/staff/remove', {
            method: 'DELETE',
            body: JSON.stringify({ target_central_user_id: centralUserId })
        }));
    },

    // Assign staff role (first-time assignment)
    assignRole: (centralUserId, role) => {
        return handleRequest(apiClient.put('/news/media-house/staff/assign-role', {
            target_central_user_id: centralUserId,
            role: role
        }));
    },

    // Update staff role (change existing role)
    updateRole: (centralUserId, newRole) => {
        return handleRequest(apiClient.put('/news/media-house/staff/role', {
            target_central_user_id: centralUserId,
            new_role: newRole
        }));
    }
};

export const articlesAPI = {
    // Create a new article
    create: (formData) => {
        return handleRequest(apiClient.post('/news/create', formData));
    },

    // Get my articles
    myArticles: () => {
        return handleRequest(apiClient.get('/news/my-articles'));
    },

    // Get all media house articles
    mediaHouseArticles: () => {
        return handleRequest(apiClient.get('/news/media-house-articles'));
    },

    // Get specific article
    getDraft: (articleId) => {
        return handleRequest(apiClient.get(`/news/${articleId}`));
    },

    // Update specific draft article
    updateDraft: (articleId, formData) => {
        return handleRequest(apiClient.put(`/news/draft/${articleId}`, formData));
    },

    // Send drafted article for review
    sendForReview: (articleId) => {
        return handleRequest(apiClient.patch(`/news/send-for-review/${articleId}`));
    },

    // Publish article
    publish: (articleId) => {
        return handleRequest(apiClient.patch(`/news/publish/${articleId}`));
    },

    // Reject article
    reject: (articleId) => {
        return handleRequest(apiClient.patch(`/news/reject/${articleId}`));
    },

    // Get pending review articles
    pendingReview: () => {
        return handleRequest(apiClient.get('/news/pending-review'));
    },

    // Return to draft
    returnToDraft: (articleId) => {
        return handleRequest(apiClient.patch(`/news/return-to-draft/${articleId}`));
    },

    // Delete article
    deleteArticle: (articleId) => {
        return handleRequest(apiClient.delete(`/news/${articleId}`));
    },

    // Get comments
    getComments: (articleId) => {
        return handleRequest(apiClient.get(`/news/${articleId}/comments`));
    },
};

// News API endpoints (Backend Integration)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const newsAPI = {
    // Get all news with pagination, filtering, search
    getAll: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.category) queryParams.append('category', params.category);
        if (params.status) queryParams.append('status', params.status);
        if (params.language) queryParams.append('language', params.language);
        if (params.search) queryParams.append('search', params.search);
        
        const url = `/api/news${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return handleRequest(apiClient.get(url));
    },

    // Get single news by ID
    getById: (id) => {
        return handleRequest(apiClient.get(`/api/news/${id}`));
    },

    // Get news by slug
    getBySlug: (slug) => {
        return handleRequest(apiClient.get(`/api/news/slug/${slug}`));
    },

    // Create news
    create: (newsData) => {
        return handleRequest(apiClient.post('/api/news', newsData));
    },

    // Update news
    update: (id, newsData) => {
        return handleRequest(apiClient.put(`/api/news/${id}`, newsData));
    },

    // Publish news
    publish: (id) => {
        return handleRequest(apiClient.put(`/api/news/${id}/publish`, {}));
    },

    // Delete news
    delete: (id) => {
        return handleRequest(apiClient.delete(`/api/news/${id}`));
    },

    // Like/Unlike news
    toggleLike: (id) => {
        return handleRequest(apiClient.put(`/api/news/${id}/like`, {}));
    },
};

// Categories API endpoints (Backend Integration)
export const categoryBackendAPI = {
    // Get all categories
    getAll: () => {
        return handleRequest(apiClient.get('/api/categories'));
    },

    // Get single category
    getById: (id) => {
        return handleRequest(apiClient.get(`/api/categories/${id}`));
    },

    // Create category (Admin only)
    create: (categoryData) => {
        return handleRequest(apiClient.post('/api/categories', categoryData));
    },

    // Update category (Admin only)
    update: (id, categoryData) => {
        return handleRequest(apiClient.put(`/api/categories/${id}`, categoryData));
    },

    // Delete category (Admin only)
    delete: (id) => {
        return handleRequest(apiClient.delete(`/api/categories/${id}`));
    },
};

// Comments API endpoints (Backend Integration)
export const commentsAPI = {
    // Get comments for a news
    getByNews: (newsId) => {
        return handleRequest(apiClient.get(`/api/comments/news/${newsId}`));
    },

    // Create comment
    create: (commentData) => {
        return handleRequest(apiClient.post('/api/comments', commentData));
    },

    // Update comment
    update: (id, commentData) => {
        return handleRequest(apiClient.put(`/api/comments/${id}`, commentData));
    },

    // Delete comment
    delete: (id) => {
        return handleRequest(apiClient.delete(`/api/comments/${id}`));
    },

    // Like comment
    toggleLike: (id) => {
        return handleRequest(apiClient.put(`/api/comments/${id}/like`, {}));
    },
};

// Backend User/Auth API endpoints
export const backendAuthAPI = {
    // Login
    login: (credentials) => {
        return handleRequest(apiClient.post('/api/auth/login', credentials));
    },

    // Register
    register: (userData) => {
        return handleRequest(apiClient.post('/api/auth/register', userData));
    },

    // Get current user
    getCurrentUser: () => {
        return handleRequest(apiClient.get('/api/auth/me'));
    },
};

// Backend Users API endpoints
export const backendUserAPI = {
    // Get all users (Admin only)
    getAll: () => {
        return handleRequest(apiClient.get('/api/users'));
    },

    // Get single user
    getById: (id) => {
        return handleRequest(apiClient.get(`/api/users/${id}`));
    },

    // Update user profile
    update: (id, userData) => {
        return handleRequest(apiClient.put(`/api/users/${id}`, userData));
    },

    // Delete user (Admin only)
    delete: (id) => {
        return handleRequest(apiClient.delete(`/api/users/${id}`));
    },

    // Update user role (Admin only)
    updateRole: (id, role) => {
        return handleRequest(apiClient.put(`/api/users/${id}/role`, { role }));
    },

    // Follow/Unfollow category
    toggleFollowCategory: (userId, categoryId) => {
        return handleRequest(apiClient.put(`/api/users/${userId}/follow-category`, { categoryId }));
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
    gallery: galleryAPI,
    staff: staffAPI,
    articles: articlesAPI,
    // New Backend APIs
    news: newsAPI,
    categoryBackend: categoryBackendAPI,
    comments: commentsAPI,
    backendAuth: backendAuthAPI,
    backendUser: backendUserAPI,
};

export default api;