/*
    @name Contoso Scuba Bot

    @author Nils Whitmont <v-niwh@microsoft.com>
    @summary Contoso Scuba Bot example for Bot Framework Node SDK

*/
'use strict';

// NODE MODULES
var builder = require('botbuilder');
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

// webchat page
server.get('/', restify.plugins.serveStatic({
  directory: './public',
  default: 'index.html'
}));
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

// "where can I go scuba diving?"
bot.dialog('pick_school', function (session) {
    // handle card submit action
    if (session.message && session.message.value) {
        session.userData.school = session.message.value.school;
        session.message.value = null; // clear message.varue
        session.beginDialog('pick_destination', { school_name: session.userData.school });
        return;
    }
    var schools_msg = require('./cards/1.schools.msg.json');
    session.send(schools_msg);
}).triggerAction({matches: /scuba/i});


bot.dialog('pick_destination', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.destination = session.message.value.destination;
        session.message.value = null;
        session.beginDialog('pick_people', { destination: session.userData.destination });
        return;
    }
    var destinations_msg = require('./cards/2.destinations.msg.json');
    destinations_msg.attachments[0].content.body[0].text = destinations_msg.attachments[0].content.body[0].text.replace(/{{school}}/, options.school_name);
    session.send(destinations_msg);
});

bot.dialog('pick_people', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.people = session.message.value.numberOfPeople;
        session.message.value = null;
        session.beginDialog('pick_date', { people: session.userData.people });
        return;
    }
    var people_msg = require('./cards/3.people.msg.json');
    // set destination name in card text
    people_msg.attachments[0].content.body[0].text = people_msg.attachments[0].content.body[0].text.replace(/{{destination}}/, options.destination);
    session.send(people_msg);

})

bot.dialog('pick_date', function (session, options) {
    if (session.message && session.message.value) {
        session.userData.date = session.message.value.date;
        session.message.value = null;
        session.beginDialog('pick_lunch');
        return;
    }
    var date_msg = require('./cards/4.date.msg.json');
    date_msg.attachments[0].content.body[0].columns[0].items[0].text = date_msg.attachments[0].content.body[0].columns[0].items[0].text.replace('{{number_of_people}}', options.people);
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
        console.log('got personalInfo:');
        console.log(session.message.value.personalInfo);
        
        session.userData.contacts = session.message.value.personalInfo;
        session.beginDialog('weather')
        return;
    }
    var personal_info_msg = require('./cards/6.personal-info.msg.json');
    session.send(personal_info_msg);
}).triggerAction({matches: /info/i});

bot.dialog('weather', function (session, options) {

    var weather_msg = require('./cards/7.weather.msg.json');

    weather_msg.text = weather_msg.text
        .replace(/{{name}})/, session.userData.contacts.firstlast)
        .replace(/{{email}}/, session.userData.contacts.email)
        .replace(/{{phone}}/, session.userData.contacts.phone)
        .replace(/{{school}}/, session.userData.school)
        .replace(/{{destination}}/, session.userData.destination);

    //weather_msg.attachments[0].content.speak = weather_msg.attachments[0].content.speak.replace(/{{weekday}}/, options.weekday);
    
    // weather_msg.attachments[0].content.body[0].columns[1].items[0].text = weather_msg.attachments[0].content.body[0].columns[1].items[0].text
    //     .replace(/{{longdate}}/, options.longdate);

        // .replace(/{{day1}}/, options.day1)
        // .replace(/{{day2}}/, options.day2)
        // .replace(/{{day3}}/, options.day3)
        // .replace(/{{day4}}/, options.day4);

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
