#!/usr/bin/env bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXTENSION_DIR=~/.local/share/gnome-shell/extensions/twingate-status@edcoffin88.ca

echo -e "${YELLOW}Installing Twingate Status extension...${NC}\n"

if ! command -v glib-compile-schemas &> /dev/null; then
    echo -e "${RED}Error: glib-compile-schemas is not installed${NC}"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt install libglib2.0-dev-bin"
    echo "  Arch/Manjaro: sudo pacman -S glib2"
    echo "  Fedora: sudo dnf install glib2-devel"
    exit 1
fi

echo -e "${GREEN}Creating extension directory...${NC}"
mkdir -p "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR/schemas"
mkdir -p "$EXTENSION_DIR/icons"

echo -e "${GREEN}Copying files...${NC}"
cp extension.js "$EXTENSION_DIR/"
cp prefs.js "$EXTENSION_DIR/"
cp metadata.json "$EXTENSION_DIR/"
cp stylesheet.css "$EXTENSION_DIR/"
cp LICENSE "$EXTENSION_DIR/" 2>/dev/null || true
cp -r icons/* "$EXTENSION_DIR/icons/"

if [ -d "schemas" ]; then
    echo -e "${GREEN}Copying and compiling GSettings schemas...${NC}"
    cp schemas/*.xml "$EXTENSION_DIR/schemas/"
    glib-compile-schemas "$EXTENSION_DIR/schemas/"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Schemas compiled successfully${NC}"
    else
        echo -e "${RED}✗ Error compiling schemas${NC}"
        exit 1
    fi

    if [ -f "$EXTENSION_DIR/schemas/gschemas.compiled" ]; then
        echo -e "${GREEN}✓ gschemas.compiled created${NC}"
        ls -lh "$EXTENSION_DIR/schemas/gschemas.compiled"
    else
        echo -e "${RED}✗ gschemas.compiled was not created${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ schemas/ directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Installation complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Restart GNOME Shell:"
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo -e "   ${GREEN}Alt+F2, type 'r', press Enter${NC}"
else
    echo -e "   ${YELLOW}Log out and log back in (Wayland)${NC}"
fi
echo ""
echo "2. Enable the extension:"
echo -e "   ${GREEN}gnome-extensions enable twingate-status@dcoffin88.ca${NC}"
echo ""
echo "3. Check logs if needed:"
echo -e "   ${GREEN}journalctl -f -o cat /usr/bin/gnome-shell | grep -i twingate${NC}"
echo ""
