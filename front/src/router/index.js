import { createRouter, createWebHistory } from 'vue-router'
import { getStoredToken, isProtectedRoute } from '../utils/auth'
import { showToast } from 'vant'

const routes = [
  {
    path: '/',
    redirect: '/notes'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录',
      keepAlive: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: {
      title: '注册',
      keepAlive: false
    }
  },
  {
    path: '/chat',
    name: 'AIChat',
    component: () => import('../views/AIChat.vue'),
    meta: {
      title: 'AI助手',
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/chat/:sessionId',
    name: 'AIChatWithSession',
    component: () => import('../views/AIChat.vue'),
    meta: {
      title: 'AI助手',
      keepAlive: true,
      requiresAuth: true
    }
  },
  // 兼容旧路由
  {
    path: '/aichat',
    redirect: '/chat'
  },
  {
    path: '/aichat/:sessionId',
    redirect: (to) => `/chat/${to.params.sessionId}`
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('../views/My.vue'),
    meta: {
      title: '我的',
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: {
      title: '个人信息',
      keepAlive: false,
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      title: '设置',
      keepAlive: false
    }
  },
  {
    path: '/aboutus',
    name: 'AboutUs',
    component: () => import('../views/AboutUs.vue'),
    meta: {
      title: '关于我们',
      keepAlive: false
    }
  },
  {
    path: '/knowledge',
    name: 'KnowledgeBase',
    component: () => import('../views/KnowledgeBase.vue'),
    meta: {
      title: '知识库管理',
      keepAlive: false,
      requiresAuth: true
    }
  },
  // 兼容旧路由
  {
    path: '/knowledgebase',
    redirect: '/knowledge'
  },
  {
    path: '/sessions',
    name: 'Sessions',
    component: () => import('../views/Sessions.vue'),
    meta: {
      title: '会话管理',
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/notes',
    name: 'NoteList',
    component: () => import('../views/NoteList.vue'),
    meta: {
      title: '笔记',
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/notes/:id',
    name: 'NoteEditor',
    component: () => import('../views/NoteEditor.vue'),
    meta: {
      title: '编辑笔记',
      keepAlive: false,
      requiresAuth: true
    }
  },
  {
    path: '/review',
    name: 'DailyReview',
    component: () => import('../views/DailyReview.vue'),
    meta: {
      title: '每日回顾',
      keepAlive: false,
      requiresAuth: true
    }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, _from, next) => {
  document.title = to.meta.title || 'AI Second Brain'

  const token = getStoredToken()

  if (to.name === 'Login' && token) {
    next('/notes')
    return
  }

  if (isProtectedRoute(to) && !token) {
    showToast('请先登录')
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
