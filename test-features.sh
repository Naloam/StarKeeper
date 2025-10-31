#!/bin/bash

echo "🧪 StarKeeper 自动化测试脚本"
echo "================================"
echo ""

# 检查服务器是否运行
echo "1️⃣ 检查开发服务器..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ 开发服务器运行在 http://localhost:3001"
elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 开发服务器运行在 http://localhost:3000"
else
    echo "❌ 开发服务器未运行"
    echo "   请先运行: npm start"
    exit 1
fi

echo ""
echo "2️⃣ 检查编译错误..."
if [ -f "dist" ]; then
    echo "✅ 项目已构建"
else
    echo "⚠️ 项目未构建（开发模式运行）"
fi

echo ""
echo "3️⃣ 检查关键文件..."
files=(
    "src/components/layout/Sidebar.jsx"
    "src/components/tags/TagModal.jsx"
    "src/components/tags/TagInput.jsx"
    "src/components/tags/TagBadge.jsx"
    "src/components/common/ShareModal.jsx"
    "src/pages/SharePage.jsx"
    "src/services/metadata.service.js"
    "src/store/index.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file 不存在"
    fi
done

echo ""
echo "4️⃣ 检查环境变量..."
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    if grep -q "VITE_DASHSCOPE_API_KEY" .env; then
        echo "   ✅ DashScope API Key 已配置"
    else
        echo "   ⚠️ DashScope API Key 未配置"
    fi
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "5️⃣ Git 状态..."
git status --short

echo ""
echo "================================"
echo "✅ 自动化检查完成"
echo ""
echo "📋 接下来请进行手动测试："
echo "   1. 打开浏览器: http://localhost:3001"
echo "   2. 登录应用"
echo "   3. 按照 TESTING_CHECKLIST.md 进行测试"
echo ""
echo "测试文档: TESTING_CHECKLIST.md"
