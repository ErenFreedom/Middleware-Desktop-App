# Use a base Windows image with Node.js installed
FROM mcr.microsoft.com/windows/servercore:ltsc2019

# Install Chocolatey
RUN powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy RemoteSigned; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"

# Install Node.js, MSYS2, and required GTK dependencies
RUN choco install -y nodejs-lts msys2
RUN refreshenv
RUN C:\tools\msys64\usr\bin\bash -lc "pacman -Syu --noconfirm"
RUN C:\tools\msys64\usr\bin\bash -lc "pacman -S --noconfirm mingw-w64-x86_64-cairo mingw-w64-x86_64-pango mingw-w64-x86_64-gtk3"

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the build command
RUN npm run build

# Define the default command
CMD ["npm", "start"]
