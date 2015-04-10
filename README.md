<title>GreenPI</title>
<div class="navbar navbar-fixed-top"></div>
<br><br><br><br><br><br><br><br><br>
<img src="readme-img/mas-logo.png" style="width: 280px; margin-left: -12px;">

<xmp theme="Cerulean" style="display:none;">

# greenpi

> raising environmental consciousness within an organization

<div style="page-break-after: always;"></div>

##Getting started

1. plug in the RaspberryPI to the small LCD with a HDMI connector
- plug in the Raspberry PI to power with a micro-usb connector
- Wait for about **90 seconds**
- You should see the main screen on the tiny LCD

  ![](readme-img/main.png)
- In your administrator computer, find out the IP address of this RaspberryPI by scanning the connected devices to your router. E.g. `172.16.1.0`
- Visit the IP address in your computer's Chrome browser. E.g. `{GREENPI_IP_ADDRESS}:8000`
- Visit the status your computer's Chrome browser. E.g. `{GREENPI_IP_ADDRESS}:8000/status`
- Visit the admin page in your computer's Chrome browser. E.g. `{GREENPI_IP_ADDRESS}:8000/admin`. The default login credentials are:

  ```
  User Name: sprout
  Password: greenpi
  ``` 
  
  ![](readme-img/admin.png) 
- Add the admin details accordingly on the admin page after logging in successfully
  
  ![](readme-img/admin-success.png)
- Go to the main page `{GREENPI_IP_ADDRESS}:8000` from your admin computer and click start.

###future changes

Just go to any browser from your admin laptop and access

1. **Change Settings**: To change any admin settings such as posters or logo access the raspberry pi's ip from your admin computer's browser again. E.g. `{GREENPI_IP_ADDRESS}:8000/admin`
1. **Stop simulation**: To stop the simulation and restart it click the hidden `PAUSE` simulation button as shown below.

  ![](readme-img/stop-click.jpg)

1. **Start simulation**: To start the simulation just click the `START` button in the middle of the screen.

  ![](readme-img/start-click.jpg)

<div style="page-break-after: always;"></div>

##Equipment

1. Raspberry PI Model B+ (waiting for Model 2 to have Graphic support for Chromium)
1. Micro USB power adapter for pi
1. LCD screen 1280 x 800
1. HDMI cable for the LCD
1. Power cable for the LCD
1. 8GB SD Card (Speed 10x) 

<div style="page-break-after: always;"></div>

##deploy to raspberrypi

1. ssh into the greenpi

  ```
  ssh greenpi 
  ```
1. go to `~/apps/greenpi` and get the latest repo code

  ```
  git pull && npm i
  npm start # or npm run reset
  ```
1. visit browser [localhost:8000](http://localhost:8000)

##install for development

1. git clone 

  ```
  $ git@github.com:ManagedApplicationServices/greenpi.git
  $ cd greenpi
  ```
1. install packages
  
  ```
  $ brew install redis
  $ npm i -g bower log.io
  $ npm i && bower i
  ```
1. setup config files

  ```
  $ cp config.sample.js config.js # amend appPath
  $ cp config/harvester.sample.conf ~/.log.io/harvester.conf # edit greenpi path for all 24 lines
  $ cp .env.sample .env # edit environment variable
  ```
1. create log folder and files

  ```
  $ mkdir logs
  $ cd logs
  $ for file in log.backup.{00..23}; do touch "$file"; done
  $ ls
  log.backup.00 log.backup.03 log.backup.06 log.backup.09 log.backup.12 log.backup.15 log.backup.18 log.backup.21
  log.backup.01 log.backup.04 log.backup.07 log.backup.10 log.backup.13 log.backup.16 log.backup.19 log.backup.22
  log.backup.02 log.backup.05 log.backup.08 log.backup.11 log.backup.14 log.backup.17 log.backup.20 log.backup.23
  ```
1. start redis (it should already be started by the daemon) and log server - run them in background or another shell

  ```
  $ redis-server &
  $ log.io-server &
  $ log.io-harvester &
  ```
1. start kraken with node and visit browser 

  ```
  # reset or start
  $ npm run reset 
  $ npm start 
  ```
1. visit the browser

  1. [localhost:8000](http://localhost:8000/) - simulation
  - [localhost:8000](http://localhost:8000/status) - status page
  - [localhost:8000](http://localhost:8000/admin) - admin settings
  - [localhost:28778](http://localhost:28778/) - log


##install fresh in a raspberry pi

1. clone the repo

  ```
  git clone git@github.com:ManagedApplicationServices/greenpi.git
  ```

###config
  
1. create the general config file

  ```
  cp config.sample.js config.js
  ```
  edit `printerIP`, `paperUsageCap`, `totalPrinters` in the config file `sudo nano config.js`

  ```
  module.exports = {
    "printerIP": "172.19.107.61",
    "paperUsageCap": 1000,
    "totalPrinters": 4,
    ...
  }
  ``` 
1. create app specific config file

	```
	cp config/development.json config/production.json
	```
	
	amend `development` to `production` and edit the wifi network access:
	
	```
	...
	{
    "production": {
      "num": 1,
      "wifi": "wlan0"
    }	
  }
	```
1. create `.env` file from sample:

  ```
  cp .env.sample .env
  ```

  edit `NODE_ENV`:

  ```
  NODE_ENV=development
  ```
1. install npm packages

  ```
  npm i -g log.io
  npm i # bower not needed as compiled css / js files are in the repo
  ```
1. initialise logging
1. start the server in any one of the 2 ways:

  1. to reset the db

    ```
    $ npm run reset
    ```
  - to start the server without any reset and continue automatically from last left state
    ```
    $ npm start
    ```
1. go to url [localhost:8000/admin](localhost:8000/admin) to amend the settings. default settings are:

  - username: `sprout`
  - password: `greenpi`

##logging

###first time

1. create empty log files for hour `00` to hour `23` in folder `logs`:

  ```
  $ for file in log.backup.{00..23}; do touch "$file"; done
  ```
- configure log harvester file `nano ~/.log.io/harvester.conf` with the log filepaths

  ```
  cp config/harvester.sample.conf ~/.log.io/harvester.conf
  ```

###each time
  
1. start log server and harvester (should be started by the kiosk mode)

  ```
  $ log.io-server
  $ log.io-harvester
  ```
- For accessing logs in the browser, go to:

  ```
  http://{GREENPI_IP_ADDRESS}:28778
  ```

##prepare sd card for brand new rpi

###1. initial setup

1. **Install**: [raspbian](http://www.raspberrypi.org/downloads/) **Jessie** on a 8GB SD Card (speed 10x)
- **bootup**: rpi and login with default credentials:

  ```
  login: pi
  password: raspberry
  ```
- general configuration with `sudo raspi-config`
- **Hostname and Hosts**
  1. set hostname of the rpi in file `/etc/hostname`

    ```
    greenpi
    ```
  - set host of the rpi in file `/etc/hosts` in the last line

    ```
    127.0.1.1 greenpi
    ```
- **Keyboard**
  1. change the keyboard layout to US
  
    ```
    sudo nano /etc/default/keyboard
    ```
    
    in the file
    
    ```
    XKBLAYOUT="us"
    ```

- **add new user**
  1. add new user `developer` and its password
  
    ```
    sudo useradd -m developer
    sudo passwd developer
    ```
  1. add user `developer` to sudoers list in file `/etc/sudoers` at the last line

    ```
    developer ALL=(ALL) NOPASSWD: ALL
    ``` 
1. reboot the pi with `sudo reboot`
1. setup wifi accordingly
1. **update** packages with an ethernet connection

  ```
  sudo apt-get update
  sudo apt-get upgrade
  ```

###2. install

1. Chromium browser with Raspbian Wheezy `sudo apt-get install chromium`
- Redis with `sudo apt-get install redis-server`

1. setup logging
	1. Access URL in the browser `{GREENPI_IP_ADDRESS}:28778`

1. **setup other config**

	1. `cp config/.xinitrc /home/developer/.xinitrc` 
	- `cp config/rc.local.sample /etc/rc.local`
	- `cp cmdline.txt.sample /boot/cmdline.txt`
	- `cp config.txt.sample /boot/config.txt`

1. **install** login GUI with `startx`
	1. [install](https://github.com/creationix/nvm#install-script) `nvm`
	
1. **setup ssh**: 
	1. ensure the ssh keys are stored in user folder `/home/developer/.ssh` and not under the root
	- create ssh keys with `ssh-keygen -t rsa -f greenpi -C "rspapps@ricoh.sg"`
	- [add SSH keys to github](https://help.github.com/articles/generating-ssh-keys/#step-4-add-your-ssh-key-to-your-account)
1. **shutdown / restart**

  1. shutdown
  
    ```
    sudo shutdown now
    ```
  1. reboot
  
    ```
    sudo reboot 
    ```

##configure RPi kiosk mode

1. edit file `/home/developer/.xinitrc`. Ensure you install `sudo apt-get install unclutter`.

  ```
  unclutter -idle 15 -root &
  xset -dpms &
  xset s off &
  
  cd ~/apps/greenpi
  nvm use iojs
  log.io-server &
  log.io-harvester &
  /home/developer/.nvm/versions/io.js/v1.6.2/bin/node server.js & > greenpi_xinitrc_log.log 2> greenpi_xinitrc_error.log
  sleep 10
  
  while true; do
    killall -TERM chromium 2>/dev/null;
    sleep 2;
    killall -9 chromium 2>/dev/null;
    chromium --incognito --kiosk --window-size=1280,800 --window-position=0,0 http://localhost:8000
  done;
  ```
1. edit file `/etc/rc.local` with login as user `developer` and `startx`

  ```
  ...
  # Print the IP address
  su -l developer -c startx &
  ...
  ```
1. edit file `/boot/cmdline.txt` add `loglevel=2` at the end
1. exit kiosk mode to command line press:

  ```
  Ctrl + Alt + F2
  ```

##configure RPi Wifi (WPA personal)

1. edit file `sudo nano /etc/network/interfaces`

  ```
  auto wlan0
  auto lo
  
  iface lo inet loopback
  iface eth0 inet dhcp
  
  allow-hotplug wlan0
  iface wlan0 inet dhcp
  
  wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
  ```
1. edit config file `sudo nano /etc/wpa_supplicant/wpa_supplicant.conf`.

  ``` 
  ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
  update_config=1

  network={
    ssid="your ssid"
    psk="password"
    proto=WPA
    key_mgmt=WPA-PSK
    pairwise=TKIP
    auth_alg=OPEN
  }
  
  network={
    ssid="another ssid"
    psk="password"
    proto=WPA
    key_mgmt=WPA-PSK
    pairwise=TKIP
    auth_alg=OPEN
  }
  ``` 
1. shutdown and restart connection

  ```
  sudo /etc/init.d/networking restart # method 1
  sudo ifdown wlan0 # method 2
  sudo ifup wlan0
  ``` 
1. check connection

  ```
  ping 8.8.8.8
  ```
1. get rpi's ip address

  ```
  ifconfig # read wlan0, 2nd line: inet addr
  ```

##backups for the sd card images

###from backup to sd card

1. All SD card images can be found in RSP AWS S3 bucket `rspdeveloper` in the filename format of `YYYYMMDD-greenpiVxx.xx.xx.img.gz`. Versions correspond to git tags deployed to production in the Raspberry PI.

  ![](readme-img/aws-s3-backups.png)
  
1. Choose the latest image according to part of the filename `YYMMDD` > Right click > Download
1. Unzip / decompress it in the command line

  ```
  tar -zvxf greenpi.img.gz
  ``` 
1. insert SD Card into your computer to [install the image](http://www.raspberrypi.org/documentation/installation/installing-images/mac.md)
1. run `diskutil` to find out which disk name e.g. `/dev/disk1`

  ```
  diskutil list
  ```
1. unmount the SD card

  ```
  diskutil unmountDisk /dev/disk1
  ```
1. load the image into the SD Card [ 8GB card will take *60 mins* ]

  ```
  sudo dd bs=1m if=greenpi.img of=/dev/disk1
  ```
1. eject SD Card
1. pull out the SD card from the computer to the Raspberry PI
1. Ensure the RPi is connected to:
  1. has the Wifi Module
  1. power
  1. LCD with HDMI
1. Turn on the power for RPi

###from sd card to backup

1. shutdown the pi properly through ssh

  ```
  sudo shutdown now
  ```
1. pull out the SD card from the pi and insert it into your computer
1. see all connected devices to your computer and recognise your SD card

  ```
  df -h
  ```
1. make an image of the SD Card with the name corresponding the the git tag shipped to production (raspberry pi) as noted on the [release github page](https://github.com/ManagedApplicationServices/greenpi/releases) *~20 mins*

  ```
  sudo dd bs=1m if=/dev/disk1 of=greenpiV0.14.0.img
  ```
1. zip the image *~5 mins*

  ```
  tar -cvzf greenpiV0.14.0.img.gz greenpiV0.14.0.img
  ```
1. Store it somewhere. E.g. Upload to AWS S3 bucket `rspdeveloper`

</xmp>
<script src="http://strapdownjs.com/v/0.2/strapdown.js"></script>
<script src="http://code.jquery.com/jquery-1.11.0.min.js"></script>
<script>
  var $head = $("head");
  var style = $("<link href='http://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>"
+"<style> "
+"  body, h1, h2, h3, h4, h5, p {"
+"    font-family: 'Open Sans', sans-serif, Helvetica, Arial, sans-serif !important;"
+"      font-weight: 300 !important"
+"  }"
+"  body, p {"
+"    text-align: justify !important;"
+"    text-justify: inter-word !important;"
+"  }"
+"</style>");
  $head.append(style);
</script>
