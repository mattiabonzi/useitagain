#!/usr/bin/env bash
clear
set -e

msg() {
    echo -e "\033[0;32m$1\033[0m"
}

msg "This is just an installer! \nRefer to the documentation of the Node Red for any doubt"
msg "Script write with <3 by:"
msg "   ______           __  "
msg "  /_  __/_  _______/ /_ "
msg "   / / / / / / ___/ __ \ "
msg "  / / / /_/ / /__  / / / "
msg " /_/  \__,_/\___/_/ /_/ "
msg "\033[0;33mBe sure that you are connected to a trusted WIFI and have internet access,\033[0;32m and taht you're running Android > 6 (api 24)\nFor more info please visit: "
msg "Use only thermux veriosn downloaded by f-droid (do not use Play-store)"
msg "Install also Termux api app from f-droid to use the sensor of the phone isnide node-red"
msg "Install also Termux boot app from f-droid to launch evetything on startup"
msg "Grant permission when asked!"
sleep 1
termux-wake-lock
sleep 5
if [ ! -d ~/storage ];then
    termux-setup-storage
    sleep 5
fi

PM2=true
NODERED=true
MOSQUITO=true
HASS=true
SQUID=

IP="$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')"

msg "Update repo"
echo y | pkg install -y wget curl
curl https://its-pointless.github.io/setup-pointless-repo.sh | bash
echo y | pkg update


msg "Configure SSH"
echo y | pkg install openssh
echo -e "android\nandroid" | passwd
sshd

msg "Install dependencies"
echo y | apt install -y openssl
echo y | apt install -y python
echo y | apt install -y python
echo y | pkg install -y clang
echo y | pkg install -y coreutils
echo y | pkg install -y nano
echo y | pkg install -y nodejs
echo y | pkg install -y openssh
echo y | pkg install -y termux-api
echo y | pkg install -y make
echo y | pkg install -y libjpeg-turbo
echo y | pkg install -y binutils
echo y | pkg install -y ndk-sysroot
echo y | pkg install -y build-essential

#Use a fixed version of python su survive across termux update
echo y | pkg uninstall -y python
wget https://raw.githubusercontent.com/mattiabonzi/android-deb/main/python/python_3.11.1_aarch64.deb
apt install -y ./python_3.11.1_aarch64.deb
rm -f python_3.11.1_aarch64.deb

msg "Install pm2"
npm i -g --unsafe-perm pm2


if [ -n "$MOSQUITTO" ];then
    msg "Install and start mosquitto" 
    echo y | pkg install mosquitto
    pm2 start mosquitto -- -v -c /data/data/com.termux/files/usr/etc/mosquitto/mosquitto.conf
fi

if [ -n "$NODERED" ];then
    msg "Install and  start node-red"
    npm i -g --unsafe-perm node-red
    pm2 start node-red
    sleep 2m
    cd ~/.node-red/
    npm install node-red-dashboard
    npm install node-red-contrib-termux-api
    pm2 restart node-red
    sleep 5
    cd ~
fi



if [ -n "$HASS" ];then
    

    #Install homeassistant
    echo y | apt -y install gcc-8
    pip install --upgrade pip
    pip install --upgrade wheel

    export CARGO_BUILD_TARGET="aarch64-linux-android"
    echo y | pkg install rust

    pip install maturin==0.14.8

    pip download orjson==3.8.1
    tar xf orjson-3.8.1.tar.gz
    cd orjson-3.8.1/
    sed -i 's/lto = "thin"/#lto = "thin"/g' Cargo.toml
    maturin build --release --strip
    cd ~
    rm orjson-3.8.1.tar.gz
    tar -czf orjson-3.8.1.tar.gz orjson-3.8.1

    pip download cryptography==38.0.3
    tar xf cryptography-38.0.3.tar.gz
    cd cryptography-38.0.3/src/rust/
    sed -i 's/lto = "thin"/#lto = "thin"/g' Cargo.toml
    maturin build --release --strip
    cd ~
    rm cryptography-38.0.3.tar.gz
    tar -czf cryptography-38.0.3.tar.gz cryptography-38.0.3

    curl https://raw.githubusercontent.com/mattiabonzi/useitagain/main/hass-requirements.txt -o req.txt

    python -m venv homeassistant
    source homeassistant/bin/activate
    pip install --upgrade pip
    pip install --upgrade wheel
    MATHLIB="m" pip install numpy==1.23.2
    pip install tzdata
    pip install aiohttp==3.8.3
    pip install orjson-3.8.1.tar.gz
    pip install cryptography-38.0.3.tar.gz
    pip install -r req.txt homeassistant==2022.12.2
    pip install -I pytz
    msg "Starting hass for the first time, it will takje some time for configuring itself"
    pm2 start hass --interpreter=python -- --config /data/data/com.termux/files/home/.homeassistant
    sleep 10m
    pm2 stop hass
    msg "Install home-assistant configurator"
    cd /data/data/com.termux/files/home/.homeassistant
    curl -LO https://raw.githubusercontent.com/danielperna84/hass-configurator/master/configurator.py
    chmod 755 configurator.py
     CONFIG="$(cat <<EOF
panel_iframe:
  configurator:
    title: Configurator
    icon: mdi:wrench
    url: http://$IP:3218
  node_red:
    title: Node-RED
    icon: mdi:cogs
    url: http://$IP:1880
EOF
)"
    printf "$CONFIG" >> ~/.homeassistant/configuration.yaml
    pm2 restart hass --interpreter=python -- --config /data/data/com.termux/files/home/.homeassistant
    pm2 start /data/data/com.termux/files/home/.homeassistant/configurator.py
    msg "Hass is installed, it should take some time for configuring itself"
fi

if [ -n "$SQUID" ];then
    msg "Install and start squid" 
    echo y | pkg install squid
    pm2 start squid
fi



msg "Save pm2 config"
pm2 save 
msg "Add pm2 resurrect to boot file"
[ ! -d ~/.termux/boot/ ] && mkdir -p ~/.termux/boot/
echo -e "#!/data/data/com.termux/files/usr/bin/sh \ntermux-wake-lock \n. \$PREFIX/etc/profile \nsshd \npm2 start all" > ~/.termux/boot/start.sh












msg "Use Username: 'admin' and Password: 'android' to connect to all servuies, you should change this ASAP!"
msg "Yout IP should be: ${IP}"
msg "Online services:\n"
msg "SSH: port 8022 (use a ssh client) (ssh admin@${IP} -p 8022)\n"
[ -n "$NODERED" ] && msg "NODE-RED: port 1880 (browser) (http://${IP}:1880)\n"
[ -n "$HASS" ] && msg "HASS: port 8123 (browser) (http://${IP}:8123)\n"
[ -n "$NODERED" ] && msg "NODE-RED DASHBOARD: port 1880 (browser) (http://${IP}:1880/ui)\n"
[ -n "$MOSQUITO" ] && msg "MOSQUITO: port 1883 (Mqtt Client)\n"
[ -n "$SQUID" ] && msg "SQUID: port 3128 (Cache proxy)\n"
msg "Visit \033[0;34museitagain.io\033[0;32m and \033[0;34mmattiabonzi.it"
