# Puts Node and pnpm on the PATH.
#
# The sandbox's shells do not always inherit nvm's PATH entries, so scripts and
# verification commands source this first rather than assuming `pnpm` resolves.
#   . scripts/env.sh
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
export PATH="$NVM_DIR/versions/node/v22.23.2/bin:$PATH"
