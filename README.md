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
1. plug in the Raspberry PI to power with a micro-usb connector
1. Wait for about **90 seconds**
1. You should see the main screen on the tiny LCD

  ![](readme-img/main.png)

1. In your administrator computer, find out the IP address of this RaspberryPI by scanning the connected devices to your router. E.g. `192.168.1.149`
1. Visit the IP address in your computer's Chrome browser. E.g. `192.168.1.149:9000`  
1. Visit the status your computer's Chrome browser. E.g. `192.168.1.149:9000/status`  
1. Visit the admin page in your computer's Chrome browser. E.g. `192.168.1.149:9000/admin`. The default login credentials are:

  ```
  User Name: sprout
  Password: greenpi
  ``` 
  
  ![](readme-img/admin.png) 
  
1. Add the admin details accordingly on the admin page after logging in succesfully:

  ```
  Current printer IP [192.168.1.172]
  Organisation CAP [1000000]
  Total printers [4]
  
  Company Logo  [upload an image]  
  
  Posters     
            [upload an image]
            [upload an image]
            [upload an image]
            [upload an image]
            [upload an image]
  
  New password
  Confirm password
  ```
  
  ![](readme-img/admin-success.png)
  
1. Go to the main page `192.168.1.149:9000` from your admin computer and click start.

###future changes

Just go to any browser fro your admin laptop and access

1. **Change Settings**: To change any admin settings such as posters or logo access the raspberry pi's ip from your admin computer's browser again. E.g. `192.168.1.149:9000/admin`
1. **Stop simulation**: To stop the simulation and restart it clikc the hidden `STOP` simulation button as shown below.

  ![](readme-img/stop-click.jpg)

1. **Start simulation**: To start the simulation just click the `START` button in the middle of the screen.

  ![](readme-img/start-click.jpg)


<div style="page-break-after: always;"></div>

##Equipment

1. Raspberry PI Model B++
1. Micro USB power adapter for pi
1. LCD screen
1. HDMI cable for the LCD
1. Power cable for the LCD
1. 8GB SD Card (Speed 10x) 

<div style="page-break-after: always;"></div>

##install in a raspberry pi

1. clone the repo

  ```
  git clone git@github.com:ManagedApplicationServices/greenpi.git
  ```
1. create the config file

  ```
  cp config.sample.json config.js
  ```
1. edit the config file `sudo nano config.js`

  ```
  module.exports = {
      "printerIP": "172.19.107.61",
      "paperUsageCap": 1000,
      "totalPrinters": 4,
      "interval": 20000,
      "appPath": "/home/developer/apps/greenpi",
      "paperUsagePath": "/web/guest/en/websys/status/getUnificationCounter.cgi",
      "machineDetailPath": "/web/guest/en/websys/status/configuration.cgi",
      "username": "sprout",
      "passwordHash": "$2a$08$oAXUGmm186QSjofIjM.fLur6ru7S6KW3L5gw9.wBMW9T9imqL/tSC"
  }
  ``` 
1. install bower and npm packages

  ```
  npm install
  bower install
  ```
1. start the server in any one of the 2 ways:

  1. to reset the db

    ```
    $ node server.js reset
    ```
  - to start the server without any reset and continue automatically from last left state
    ```
    $ node server.js
    ```
1. go to url [localhost:9000/admin](localhost:9000/admin) to amend the settings. default settings are:

  - username: `sprout`
  - password: `greenpi`


##deploy to raspberrypi

1. ssh into the greenpi

  ```
  ssh greenpi 
  ```
1. go to `~/apps/greenpi` and get the latest repo code

  ```
  git pull
  npm install && bower install
  node index.js
  ```
1. visit browser [localhost:9000](http://localhost:9000)

##install for development

1. start redis

  ```
  redis-server
  ```
  
1. start kraken with node and visit browser [localhost:9000](http://localhost:9000/)

  ```
  nodemon index.js 
  ```


##logging

###first time

1. create empty log files for hour `00` to hour `23`:

  ```
  for file in log.backup.{00..23}; do touch "$file"; done
  ```
- configure log harvester file `nano ~/.log.io/harvester.conf` with the log filepaths

  ```
  exports.config = {
    nodeName: "express_server",
    logStreams: {
      greenpi: [
        "/absolute/path/to/greenpi/logs/log.backup.00",
        "/absolute/path/to/greenpi/logs/log.backup.01",
        "/absolute/path/to/greenpi/logs/log.backup.02",
        "/absolute/path/to/greenpi/logs/log.backup.03",
        "/absolute/path/to/greenpi/logs/log.backup.04",
        "/absolute/path/to/greenpi/logs/log.backup.05",
        "/absolute/path/to/greenpi/logs/log.backup.06",
        "/absolute/path/to/greenpi/logs/log.backup.07",
        "/absolute/path/to/greenpi/logs/log.backup.08",
        "/absolute/path/to/greenpi/logs/log.backup.09",
        "/absolute/path/to/greenpi/logs/log.backup.10",
        "/absolute/path/to/greenpi/logs/log.backup.11",
        "/absolute/path/to/greenpi/logs/log.backup.12",
        "/absolute/path/to/greenpi/logs/log.backup.13",
        "/absolute/path/to/greenpi/logs/log.backup.14",
        "/absolute/path/to/greenpi/logs/log.backup.15",
        "/absolute/path/to/greenpi/logs/log.backup.16",
        "/absolute/path/to/greenpi/logs/log.backup.17",
        "/absolute/path/to/greenpi/logs/log.backup.18",
        "/absolute/path/to/greenpi/logs/log.backup.19",
        "/absolute/path/to/greenpi/logs/log.backup.20",
        "/absolute/path/to/greenpi/logs/log.backup.21",
        "/absolute/path/to/greenpi/logs/log.backup.22",
        "/absolute/path/to/greenpi/logs/log.backup.23"
      ]
    },
    server: {
      host: '0.0.0.0',
      port: 28777
    }
  }
  ```

###each time
  
1. start log server and harvester (should be started by the kiosk mode)

  ```
  $ log.io-server
  $ log.io-harvester
  ```
- For accessing logs in the browser, go to:

  ```
  http://<rpi_ip>:28778
  ```



##prepare sd card from brand new rpi

###1. initial setup

1. **Install**: [raspbian](http://www.raspberrypi.org/downloads/) **Jessie** on a 8GB SD Card (speed 10x)
1. **bootup**: rpi and login with default credntials:

  ```
  login: pi
  password: raspberry
  ```
1. general configuration with `sudo raspi-config`
1. **Hostname and Hosts**
  1. set hostname of the rpi in file `/etc/hostname`

    ```
    greenpi
    ```
  1. set host of the rpi in file `/etc/hosts` in the last line

    ```
    127.0.1.1 greenpi
    ```
1. **Keyboard**
  1. change the keyboard layout to US
  
    ```
    sudo nano /etc/default/keyboard
    ```
    
    in the file
    
    ```
    XKBLAYOUT="us"
    ```

1. **add new user**
  1. add new user `developer` and its password
  
    ```
    sudo useradd -m developer
    sudo passwd developer
    ```
  1. add user `developer` to sudoers list in file `/etc/sudoers` at the last line

    ```
    developer ALL=(ALL) NOPASSWD: ALL
    ``` 

1. **update** packages with an ethernet connection

  ```
  sudo apt-get update
  sudo apt-get upgrade
  ```

1. setup wifi accordingly
1. **screen resolution**: edit file `/boot/config.txt`
  
  ```
  disable_overscan=1
  framebuffer_width=1280
  framebuffer_height=800
  ``` 
1. **install** login GUI with `startx`
	1. [install](https://github.com/creationix/nvm#install-script) `nvm`
	1. chromium browser
1. **setup ssh**: ensure the ssh keys are stored in user folder `/home/developer/.ssh` and not under the root
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

1. edit file `/home/developer/.xinitrc`

  ```
  unclutter -idle 15 -root &
  xset -dpms &
  xset s off &
  
  cd ~/apps/greenpi
  /home/developer/.nvm/v0.10.26/bin/node index.js & > greenpi_xinitrc_log.log 2> greenpi_xinitrc_error.log
  sleep 10
  
  while true; do
          killall -TERM chromium 2>/dev/null;
          sleep 2;
          killall -9 chromium 2>/dev/null;
          chromium --incognito --kiosk --window-size=1280,800 --window-position=0,0 http://localhost:9000
  done;
  ```
1. edit file `/etc/rc.local` with login as user `developer` and `startx`

  ```
  #!/bin/sh -e
  #
  # rc.local
  #
  # This script is executed at the end of each multiuser runlevel.
  # Make sure that the script will "exit 0" on success or any other
  # value on error.
  #
  # In order to enable or disable this script just change the execution
  # bits.
  #
  # By default this script does nothing.
  
  # Print the IP address
  
  su -l developer -c startx &
  
  _IP=$(hostname -I) || true
  if [ "$_IP" ]; then
    printf "My IP address is %s\n" "$_IP"
  fi
  
  exit 0
  ```
1. edit file `/boot/cmdline.txt` to hide bootup text

  ```
  dwc_otg.lpm_enable=0 console=ttyAMA0,115200 console=tty3 root=/dev/mmcblk0p6 rootfstype=ext4 elevator=deadline rootwait loglevel=3
  ```
1. exit kiosk mode to command line press:

  ```
  Ctrl + Alt + F2
  ```

##access logs

1. Access URL in the browser `<RPi-IP-Address>:28778`

##create splash screen

**Note**: Reference on [how to create the splash screen](http://www.edv-huber.com/index.php/problemloesungen/15-custom-splash-screen-for-raspberry-pi-raspbian). This splash screen will only be available after complete boot up.

1. install frame buffer image

  ```
  sudo apt-get install fbi
  ```
1. create a daemon file `/etc/init.d/asplashscreen`

  ```
  #!/bin/sh
  
  do_start () {
  
      /usr/bin/fbi -T 1 -noverbose -a /etc/splash.jpg
      exit 0
  }
  
  case "$1" in
    start|"")
      do_start
      ;;
    restart|reload|force-reload)
      echo "Error: argument '$1' not supported" >&2
      exit 3
      ;;
    stop)
      # No-op
      ;;
    status)
      exit 0
      ;;
    *)
      echo "Usage: asplashscreen [start|stop]" >&2
      exit 3
      ;;
  esac
  
  :
  ```
1. make it executable

  ```
  sudo chmod a+x /etc/init.d/asplashscreen
  ```
1. move an image to `/etc/splash.jpg`

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
1. edit config file `sudo nano /etc/wpa_supplicant/wpa_supplicant.conf`

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



##changelog

1. `v0.14.0` minor adjustments 
1. `v0.13.0` printer info is gotten upon clicking the start button
1. `v0.12.0` refresh page, async pattern and demo mode
1. `v0.10.0` connected to live printer data
1. `v0.9.0` rotating posters at intervals of 2.5 minutes
1. `v0.8.1` moved the last tree away from the right scrollbar and positioned the graph
1. `v0.8.0` moved everything away from right scrollbar of the browser
1. `v0.7.0` simplified to static cloud messages
1. `v0.6.0` simplified tree branches, removed animations
1. `v0.2.0` simulation at every interval 1 Apr 2014
1. `v0.1.0` reducing trees [e357d9a](https://github.com/ManagedApplicationServices/greenpi/commit/e357d9a0338ca0231798968c26b68fec6caadef3) 26 Mar 2014

  



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








