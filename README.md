# 健康习惯追踪网站架构设计

## 项目结构

```
health-tracker/
│
├── client/                 # 前端React应用
│   ├── public/             # 静态文件
│   └── src/                # 源代码
│       ├── components/     # UI组件
│       ├── pages/          # 页面组件
│       ├── services/       # API服务
│       ├── utils/          # 工具函数
│       ├── App.js          # 主应用组件
│       └── index.js        # 入口文件
│
├── server/                 # 后端Node.js/Express应用
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── models/             # 数据模型
│   ├── routes/             # API路由
│   ├── utils/              # 工具函数
│   ├── app.js              # 应用入口
│   └── server.js           # 服务器启动
│
├── database/               # 数据库相关
│   ├── migrations/         # 数据库迁移
│   └── seeders/            # 种子数据
│
├── docker/                 # Docker配置
│   ├── client/             # 前端Docker配置
│   ├── server/             # 后端Docker配置
│   └── database/           # 数据库Docker配置
│
├── .gitignore              # Git忽略文件
├── docker-compose.yml      # Docker Compose配置
├── README.md               # 项目说明
└── package.json            # 项目依赖
```

## 技术栈

### 前端
- **框架**: React.js
- **状态管理**: Redux或Context API
- **路由**: React Router
- **UI库**: Ant Design或Material-UI
- **HTTP客户端**: Axios
- **图表**: Chart.js或Recharts

### 后端
- **框架**: Node.js + Express.js
- **认证**: JWT (JSON Web Tokens)
- **API文档**: Swagger
- **数据验证**: Joi或Yup
- **日志**: Winston

### 数据库
- **数据库**: MySQL
- **ORM**: Sequelize

### 开发工具
- **编辑器**: Visual Studio Code
- **版本控制**: Git + GitHub
- **容器化**: Docker
- **CI/CD**: GitHub Actions

### 部署
- **容器编排**: Docker Compose
- **服务器**: ARM架构服务器

## 数据模型设计

### 用户表 (Users)
- id: 唯一标识符
- username: 用户名
- email: 电子邮件
- password: 密码(加密存储)
- created_at: 创建时间
- updated_at: 更新时间

### 记录表 (Records)
- id: 唯一标识符
- user_id: 用户ID(外键)
- date: 日期
- time: 时间
- duration: 持续时间
- mood_before: 之前情绪
- mood_after: 之后情绪
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

### 目标表 (Goals)
- id: 唯一标识符
- user_id: 用户ID(外键)
- type: 目标类型
- target: 目标值
- period: 周期(日/周/月)
- start_date: 开始日期
- end_date: 结束日期
- status: 状态
- created_at: 创建时间
- updated_at: 更新时间

### 健康数据表 (HealthData)
- id: 唯一标识符
- user_id: 用户ID(外键)
- date: 日期
- sleep_hours: 睡眠时间
- stress_level: 压力水平
- energy_level: 能量水平
- created_at: 创建时间
- updated_at: 更新时间

## API设计

### 认证API
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/me - 获取当前用户
- POST /api/auth/logout - 登出

### 记录API
- GET /api/records - 获取所有记录
- GET /api/records/:id - 获取单个记录
- POST /api/records - 创建记录
- PUT /api/records/:id - 更新记录
- DELETE /api/records/:id - 删除记录

### 目标API
- GET /api/goals - 获取所有目标
- GET /api/goals/:id - 获取单个目标
- POST /api/goals - 创建目标
- PUT /api/goals/:id - 更新目标
- DELETE /api/goals/:id - 删除目标

### 数据分析API
- GET /api/analytics/frequency - 获取频率分析
- GET /api/analytics/trends - 获取趋势分析
- GET /api/analytics/correlations - 获取相关性分析

## 功能模块

### 1. 用户认证模块
- 注册
- 登录
- 个人资料管理
- 密码重置

### 2. 记录管理模块
- 日历视图
- 添加/编辑/删除记录
- 记录详情

### 3. 目标管理模块
- 设置目标
- 目标进度追踪
- 成就系统

### 4. 数据分析模块
- 趋势图表
- 模式识别
- 健康关联分析

### 5. 资源中心模块
- 健康知识
- 专家建议
- 常见问题

### 6. 设置模块
- 通知设置
- 隐私设置
- 账户管理