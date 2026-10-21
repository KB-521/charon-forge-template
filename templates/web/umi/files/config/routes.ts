export default [
  { path: '/', redirect: '/dashboard' },
  {
    name: '工作台',
    path: '/dashboard',
    icon: 'DashboardOutlined',
    component: './Dashboard',
  },
  {
    name: '通用组件',
    path: '/examples',
    icon: 'AppstoreOutlined',
    routes: [
      { path: '/examples', redirect: '/examples/table' },
      { name: '数据列表', path: '/examples/table', component: './Table' },
      { name: '文件上传', path: '/examples/uploads', component: './Uploads' },
    ],
  },
  {
    name: '个人资料',
    path: '/profile',
    icon: 'UserOutlined',
    component: './Profile',
  },
  {
    name: '管理示例',
    path: '/admin',
    component: './Admin',
    access: 'canAdmin',
    hideInMenu: true,
  },
  { path: '/403', component: './403', layout: false },
  { path: '*', component: './404', layout: false },
]
