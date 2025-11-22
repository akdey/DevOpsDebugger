"""MCP (Model Context Protocol) clients for external tools."""
from typing import Dict, Any, List

# Placeholder for MCP integration
# This can be expanded with actual MCP clients as needed


class MCPRegistry:
    """Registry of available MCPs."""
    
    def __init__(self):
        self.mcps: Dict[str, Any] = {}
    
    def register(self, name: str, mcp_instance):
        """Register an MCP."""
        self.mcps[name] = mcp_instance
    
    def get(self, name: str):
        """Get an MCP by name."""
        return self.mcps.get(name)


# Global registry
mcp_registry = MCPRegistry()
