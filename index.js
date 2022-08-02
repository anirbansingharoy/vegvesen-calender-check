const fetch = require('node-fetch');
const Push = require('pushover-notifications')
const nodeSchedule = require('node-schedule');
require('dotenv').config();

let trafficStations = [{ stationId: "081", stationName: "Risiloka" },
{ stationId: "051", stationName: "Drobak" },
{ stationId: "071", stationName: "Lilistrom"},
{ stationId: "061", stationName: "Billingstad"}];
let sentNotifications = new Set()
const COOKIE = process.env.COOKIE;
let push = new Push({
    user: process.env.PUSHOVER_USER_ID,
    token: process.env.PUSHOVER_TOKEN,
})
const maxDateRange = new Date(process.env.MAX_DATE);
const minDateRange = new Date(process.env.MIN_DATE);

const job =  nodeSchedule.scheduleJob('*/10 * * * * *', function () {
    try {
        
        trafficStations.forEach(trafficStation => {

            let URL = "https://forerett-adapter.atlas.vegvesen.no/provetimer?v=2&arbeidsflytId=878144905&klasse=B&trafikkstasjonId={stationId}"
                .replace("{stationId}", trafficStation.stationId);
            fetch(URL, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-GB,en;q=0.9",
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "cookie": COOKIE,
                    "Referer": "https://www.vegvesen.no/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": null,
                "method": "GET"
            })
                .then(res => {
                    if(res.ok) {
                        return res.json();
                    } else {
                        throw "Invalid response from vegebasen. Response Status "+res.status
                    }                
                
                }).then(schedules => {                                                    
                    if (schedules.length == 0) {
                        console.log("No Schedule present at the moment for " + trafficStation.stationName)
                    } else {  
                        console.log("Response from vegebasen " +JSON.stringify(schedules)); 

                        let pushSentThisIteration = 0;
                        for(let i = 0; i < schedules.length ; i++) {

                            if((maxDateRange < new Date(schedules[i].start) || (minDateRange > new Date(schedules[i].start)))) {
                                // console.log("Schedule for school " + trafficStation.stationName + " beyond the desired calender dates . Schedule Date: " + schedules[i].start + " Max Date:" + maxDateRange + " Min Date:" + minDateRange);                        
                                continue; 
                            }

                            if (sentNotifications.has(trafficStation.stationName + schedules[i].start)) {
                                console.log("Notifications already sent for school " + trafficStation.stationName + " for the time " +schedules[i].start );                        
                            } else {

                                   if(pushSentThisIteration >= 5){
                                       break;
                                   }                                    
                                    let msg = {
                                        message: schedules[i].start,
                                        title: trafficStation.stationName,
                                        sound: 'magic',
                                        priority: 1
                                    }
                                    pushSentThisIteration++;
                                    try {
                                    push.send(msg, function (err, result) {
                                        if (err) {
                                            console.log("Unable to send notifications", err);
                                        } else {
                                            console.log("Sent Notification for school " + trafficStation.stationName + " for the time " +schedules[i].start);                                            
                                            sentNotifications.add(trafficStation.stationName + schedules[i].start);                                        
                                        }
                                    })}
                                     catch(err) {
                                            console.error(err)
                                     }
                            }

                        }                        
                    }
                })
                .catch(error => console.error(error));;
        })
    }
    catch(err) {
        console.error(err)
      }
})



var express = require("express");
var app = express();

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`App: listening on port ${port}`);
});
