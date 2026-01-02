# MTG Event Planner - Makefile
# ============================
# Commands for development, enrichment, and deployment

.PHONY: help dev build preview extract enrich-prepare enrich-apply enrich-geocode enrich-all clean

# Default target - show help
help:
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║              MTG Event Planner - Available Commands            ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development server"
	@echo "  make build            Build for production"
	@echo "  make preview          Preview production build"
	@echo ""
	@echo "Event Extraction:"
	@echo "  make extract          Extract events from events.txt to JSON"
	@echo ""
	@echo "Enrichment (run in order):"
	@echo "  make enrich-prepare   Generate search queries for missing data"
	@echo "  make enrich-apply     Apply enrichment results from JSON file"
	@echo "  make enrich-geocode   Geocode events with addresses but no coordinates"
	@echo "  make enrich-all       Run full enrichment pipeline (interactive)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            Remove build artifacts"
	@echo "  make status           Show enrichment status"
	@echo ""

# ============================================================================
# DEVELOPMENT
# ============================================================================

# Start development server
dev:
	@echo "🚀 Starting development server..."
	yarn dev

# Build for production
build:
	@echo "🏗️  Building for production..."
	yarn build

# Preview production build
preview:
	@echo "👀 Previewing production build..."
	yarn preview

# ============================================================================
# EVENT EXTRACTION
# ============================================================================

# Extract events from events.txt
extract:
	@echo "📄 Extracting events from events.txt..."
	node enrichment/extract.js

# ============================================================================
# ENRICHMENT
# ============================================================================

# Generate enrichment queries (default: 10 items)
enrich-prepare:
	@echo "🔍 Generating enrichment queries..."
	node enrichment/prepare.js $(LIMIT)

# Generate more enrichment queries
enrich-prepare-50:
	@echo "🔍 Generating 50 enrichment queries..."
	node enrichment/prepare.js 50

enrich-prepare-100:
	@echo "🔍 Generating 100 enrichment queries..."
	node enrichment/prepare.js 100

enrich-prepare-all:
	@echo "🔍 Generating all enrichment queries..."
	node enrichment/prepare.js 999

# Apply enrichment results from JSON file
# Default: enrichment/results.json
# Usage: make enrich-apply FILE=path/to/results.json
enrich-apply:
	@if [ -z "$(FILE)" ]; then \
		echo "📎 Applying enrichment from enrichment/results.json..."; \
		node enrichment/apply.js; \
	else \
		echo "📎 Applying enrichment from $(FILE)..."; \
		node enrichment/apply.js $(FILE); \
	fi

# Geocode events with addresses but no coordinates
enrich-geocode:
	@echo "🌍 Geocoding events..."
	node enrichment/geocode.js

# Full enrichment pipeline (interactive)
enrich-all:
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                  Full Enrichment Pipeline                      ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "This will run the full enrichment pipeline."
	@echo "Make sure you have created enrichment-results.json first."
	@echo ""
	@echo "Steps:"
	@echo "  1. Apply enrichment results"
	@echo "  2. Geocode remaining events"
	@echo "  3. Copy to public/"
	@echo ""
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@$(MAKE) enrich-apply
	@$(MAKE) enrich-geocode
	@echo ""
	@echo "✅ Enrichment pipeline complete!"
	@echo ""

# Show enrichment status
status:
	@echo ""
	@echo "📊 Enrichment Status"
	@echo "===================="
	@echo ""
	@if [ -f public/events-metadata.json ]; then \
		echo "Events file: public/events-metadata.json"; \
		node -e "const d=require('./public/events-metadata.json'); \
			console.log('  Total events:', d.events.length); \
			console.log('  With addresses:', d.events.filter(e=>e.address).length); \
			console.log('  With coordinates:', d.events.filter(e=>e.coordinates).length); \
			console.log('  With links:', d.events.filter(e=>e.eventLink).length); \
			console.log('  Last updated:', d.metadata.lastUpdated);"; \
	else \
		echo "❌ public/events-metadata.json not found"; \
		echo "   Run 'make extract' first"; \
	fi
	@echo ""

# ============================================================================
# MAINTENANCE
# ============================================================================

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	@echo "✅ Clean complete"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	yarn install

# ============================================================================
# SHORTCUTS
# ============================================================================

# Common shortcut aliases
prep: enrich-prepare
apply: enrich-apply
geo: enrich-geocode
s: status
