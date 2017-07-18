/*
    @name Contoso Scuba Bot

    @author Nils Whitmont <v-niwh@microsoft.com>
    @summary Contoso Scuba Bot example for Bot Framework Node SDK

*/
'use strict';

// NODE MODULES
var builder = require('botbuilder');
var moment = require('moment');
var restify = require('restify');

// LOCAL VARS
var fabricamSchoolName = "Fabrikam";
var margiesSchoolName = "Margie's Travel";
var relecloudSchoolName = "Relecloud Diving";
var adventureSchoolName = "Adventure Works";

// INIT BOT SERVER
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

//Get secrets from server environment
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Create chat bot
var bot = new builder.UniversalBot(connector);

// bind connector to messages endpoint
server.post('/api/messages', connector.listen());

// landing page
server.get('/', restify.plugins.serveStatic({
  directory: './public',
  default: 'index.html'
}));

// webchat page
server.get('/chat', restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}));

// welcome message
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message
            .membersAdded
            .forEach(function (identity) {
                if (identity.id == message.address.bot.id) {
                    var welcome_msg = require('./cards/0.welcome.msg.json');
                    welcome_msg.address = message.address
                    bot.send(welcome_msg)
                } else {

                }
            });
    }
});

/* Dialogs */
bot.dialog('/', function (session) {
    session.send("default dialog here");
});

bot.dialog('welcome_user', function (session) {
    var welcome_msg = require('./cards/0.welcome.msg.json');
    session.send(welcome_msg)
});

// "where can I go scuba diving?"
bot.dialog('pick_school', function (session) {
    // handle card submit action
    if (session.message && session.message.value) {
        session.userData.school = session.message.value.school;
        session.message.value = null; // clear message.varue
        session.beginDialog('pick_destination');
        return;
    }
    var schools_msg = require('./cards/1.schools.msg.json');
    session.send(schools_msg);
}).triggerAction({matches: /scuba|diving|dive/i});


bot.dialog('pick_destination', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.destination = session.message.value.destination;
        session.message.value = null;
        session.beginDialog('pick_people');
        return;
    }
    var destinations_msg = require('./cards/2.destinations.msg.json');
    destinations_msg.speak = destinations_msg.speak.replace(/{{school}}/, session.userData.school);
    destinations_msg.attachments[0].content.body[0].text = destinations_msg.attachments[0].content.body[0].text.replace(/{{school}}/, session.userData.school);
    session.send(destinations_msg);
});

bot.dialog('pick_people', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.people = session.message.value.numberOfPeople;
        session.message.value = null;
        session.beginDialog('pick_date');
        return;
    }
    var people_msg = require('./cards/3.people.msg.json');
    // set destination name in card text
    people_msg.attachments[0].content.body[0].text = people_msg.attachments[0].content.body[0].text.replace(/{{destination}}/, session.userData.destination);
    session.send(people_msg);

})

bot.dialog('pick_date', function (session, options) {
    if (session.message && session.message.value) {
        var selectedDate = session.message.value.scheduleDate;
        session.userData.date = selectedDate;
        // compute various date formats used by weather card
        session.userData.longdate = moment(selectedDate).format('dddd MMM Do');
        session.userData.weekday = moment(selectedDate).format('dddd');
        session.userData.day1 = moment(selectedDate).format('ddd');
        session.userData.day2 = moment(selectedDate).add(1, 'days').format('ddd');
        session.userData.day3 = moment(selectedDate).add(2, 'days').format('ddd');
        session.userData.day4 = moment(selectedDate).add(3, 'days').format('ddd');
        // clear out message.value
        session.message.value = null;
        session.beginDialog('pick_lunch');
        return;
    }
    var date_msg = require('./cards/4.date.msg.json');
    date_msg.speak = date_msg.speak.replace(/{{number_of_people}}/, session.userData.people);
    date_msg.attachments[0].content.body[0].columns[0].items[0].text = date_msg.attachments[0].content.body[0].columns[0].items[0].text.replace('{{number_of_people}}', session.userData.people);
    session.send(date_msg);
})

bot.dialog('pick_lunch', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.lunch = session.message.value.mealOptions;
        session.message.value = null;
        session.beginDialog('personal_info');
        return;
    }
    var lunch_msg = require('./cards/5.lunch.msg.json');
    session.send(lunch_msg);
});

bot.dialog('personal_info', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.firstlast = session.message.value.firstlast;
        session.userData.email = session.message.value.email;
        session.userData.phone = session.message.value.phone;
        session.beginDialog('weather')
        return;
    }
    var personal_info_msg = require('./cards/6.personal-info.msg.json');
    personal_info_msg.address = session.message.address;
    session.send(personal_info_msg);
}).triggerAction({matches: /info/i});

bot.dialog('weather', function (session, options) {

    var weather_msg = require('./cards/7.weather.msg.json');

    weather_msg.text = weather_msg.text.replace(/{{name}}/, session.userData.firstlast);
    weather_msg.text = weather_msg.text.replace(/{{email}}/, session.userData.email)
    weather_msg.text = weather_msg.text.replace(/{{phone}}/, session.userData.phone)
    weather_msg.text = weather_msg.text.replace(/{{school}}/, session.userData.school)
    weather_msg.text = weather_msg.text.replace(/{{destination}}/, session.userData.destination);

    weather_msg.attachments[0].content.speak = weather_msg.attachments[0].content.speak.replace(/{{weekday}}/, session.userData.weekday);
    
    weather_msg.attachments[0].content.body[0].columns[1].items[0].text = weather_msg.attachments[0].content.body[0].columns[1].items[0].text.replace(/{{longdate}}/, session.userData.longdate);

    weather_msg.attachments[0].content.body[1].columns[0].items[0].text = weather_msg.attachments[0].content.body[1].columns[0].items[0].text.replace(/{{day1}}/, session.userData.day1);
    weather_msg.attachments[0].content.body[1].columns[1].items[0].text = weather_msg.attachments[0].content.body[1].columns[1].items[0].text.replace(/{{day2}}/, session.userData.day2);
    weather_msg.attachments[0].content.body[1].columns[2].items[0].text = weather_msg.attachments[0].content.body[1].columns[2].items[0].text.replace(/{{day3}}/, session.userData.day3);
    weather_msg.attachments[0].content.body[1].columns[3].items[0].text = weather_msg.attachments[0].content.body[1].columns[3].items[0].text.replace(/{{day4}}/, session.userData.day4);

    session.send(weather_msg);
    session.endDialog();
});

// wildlife dialog handler
bot.dialog('wildlife', function (session) {
    var wildlife_msg = require('./cards/wildlife.msg.json');
    session.send(wildlife_msg);
}).triggerAction({matches: /wildlife/i});

// danger dialog handler
bot.dialog('danger', function (session) {
    session.send(require('./cards/danger.msg.json'));
    session.endDialog();
}).triggerAction({matches: /danger/i});

// restart dialog handler
bot.dialog('restart', function (session) {
    session.beginDialog('welcome_user');
}).triggerAction({matches: /restart|quit/i});

// END OF LINE
