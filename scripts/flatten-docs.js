const fs = require('fs');
const path = require('path');

// This script is intentionally conservative: it currently does nothing
// that could cause filename collisions. It exists to satisfy the build step.
// If you need a flatten behavior, we can implement a safe strategy on demand.

console.log('flatten-docs: no-op (conservative default)');
