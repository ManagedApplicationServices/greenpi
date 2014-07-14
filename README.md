# greenpi

> raising environmental consciousness within an organization

##install in production

1. clone the repo

	```
	git clone git@github.com:ManagedApplicationServices/greenpi.git
	```
1. create the config file

	```
	cp config.sample.json config.json
	```
1. edit the config file `sudo nano config.json`

	```
	{
    "printerIP": "172.19.107.61",
    "paperUsageCap": 96,
    "totalPrinters": 4,
    "appPath": "/path/to/app",
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
1. start the server

	```
	$ node index.js
	```
1. go to url [localhost:9000/admin](localhost:9000/admin) to amend the settings. default settings are:

	- username: `sprout`
	- password: `greenpi`


##development

1. start redis

	```
	redis-server
	```
	
1. start kraken with node and visit browser [localhost:9000](http://localhost:9000/)

	```
	node index.js 
	```

1. compile sass to css

	```
	gulp
	```

##deploy to raspberrypi

1. ssh into the greenpi
1. go to `~/apps/greenpi` and get the latest repo code

	```
	git pull
	npm install
	gulp
	npm start
	```
1. visit browser [localhost:9000](http://localhost:9000)

##configure RPi Wifi

1. edit file `sudo nano /etc/network/interfaces`

	```
	auto lo

	iface lo inet loopback
	iface eth0 inet dhcp
	
	allow-hotplug wlan0
	auto wlan0
	
	iface wlan0 inet dhcp
	
	pre-up wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf
	post-down killall -q wpa_supplicant
	
	address 192.168.1.189
	```

1. edit config file `sudo nano /etc/wpa_supplicant/wpa_supplicant.conf`

	```
	update_config=1
	
	network={
		ssid="funnybunny"
		psk="i2n$a@i32"
		proto=WPA
		key_mgmt=WPA-PSK
		pairwise=TKIP
	   auth_alg=OPEN
	}
	
	ctrl_interface=DIR=/var/run/wpa_supplicant
	```
	

1. shutdown and restart connection

	```
	sudo ifdown wlan0
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


##changelog

1. `v0.13.0` printer info is gotten upon clicking the start button
1. `v0.12.0` refresh page, async pattern and demo mode
1. `v0.10.0` connected to live printer data
1. `v0.9.0` rotating posters at intervals of 2.5 minutes
1. `v0.8.1` moved the last tree away from the right scrollbar and positioned the graph
1. `v0.8.0` moved everything away from right scrollbar of the browser
1. `v0.7.0` simplified to static cloud messages
1. `v0.6.0` simplified tree branches, removed animations
1. `v0.2.0` simulation at every interval 1 Apr 2014

  <img src="changelog/v0.2.0.gif" height=200 width=310>

1. `v0.1.0` reducing trees [e357d9a](https://github.com/ManagedApplicationServices/greenpi/commit/e357d9a0338ca0231798968c26b68fec6caadef3) 26 Mar 2014

	<img src="changelog/v0.1.0.gif" height=100 width=400>
	

