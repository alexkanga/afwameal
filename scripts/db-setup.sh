#!/bin/bash

# MEAL Platform - Database Setup Script
# This script helps switch between SQLite (local) and PostgreSQL (Vercel)

echo "🔧 MEAL Platform Database Setup"
echo "================================"
echo ""
echo "Choose your environment:"
echo "1) Local Development (SQLite)"
echo "2) Vercel Production (PostgreSQL)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo "📦 Setting up SQLite for local development..."
        cp prisma/schema.sqlite.prisma prisma/schema.prisma
        bun run db:generate
        bun run db:push
        echo "✅ SQLite setup complete!"
        ;;
    2)
        echo "🐘 Setting up PostgreSQL for Vercel..."
        echo "⚠️  Make sure you have set up Vercel Postgres and added these environment variables:"
        echo "   - DATABASE_URL (pooled connection)"
        echo "   - DIRECT_DATABASE_URL (direct connection)"
        echo ""
        echo "The schema is already configured for PostgreSQL."
        bun run db:generate
        bun run db:push
        echo "✅ PostgreSQL setup complete!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
