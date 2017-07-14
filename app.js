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

// welcome message
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message
            .membersAdded
            .forEach(function (identity) {
                if (identity.id == message.address.bot.id) {
                    // Bot is joining conversation
                    // - For WebChat channel you'll get this on page load.
                    //bot.beginDialog('welcome_user');
                    var welcome_msg = require('./cards/0.welcome.msg.json');
                    welcome_msg.address = message.address
                    bot.send(welcome_msg)
                } else {
                    // User is joining conversation
                    // - For WebChat channel this will be sent when user sends first message.
                    // - When a user joins a conversation the address.user field is often for
                    // essentially a system account so to ensure we're targeting the right   user we
                    // can tweek the address object to reference the joining user.
                    // - If we wanted to send a private message to teh joining user we could
                    // delete the address.conversation field from the cloned address. var address =
                    // Object.create(message.address); address.user = identity; var reply = new
                    // builder.Message()         .address(address)         .text("Hello %s",
                    // identity.name); bot.send(reply);
                }
            });
    }
});

/* Dialogs */
bot.dialog('/', function (session) {
    if (session.message && session.message.value) {
        console.log('got session.message.value:');
        console.log(session.message.value);
        return;
    }
    //  console.log('got session object:')  console.info(session.message.address);
    // var welcome_msg = require('./cards/1.welcome.msg.json');
    // welcome_msg.conversation = session.message.address.conversation;
    // welcome_msg.from = session.message.address.bot;  welcome_msg.recipient =
    // session.message.address.user;  console.log('loaded welcome_msg:')
    // console.log(welcome_msg);
    session.send("default dialog here");
    //session.send(welcome_msg);
});

// bot.dialog('welcome_user', function (session) {
//     var welcome_msg = require('./cards/0.welcome.msg.json');
//     session.send(welcome_msg);
// });

// "where can I go scuba diving?"
bot.dialog('pick_school', function (session) {
    // handle card submit action
    if (session.message && session.message.value) {
        // user selected a school
        console.log('[pick_school] Selected School Name -->');
        console.log(session.message.value);

        var selected_school = session.message.value.school;
        session.message.value = null; // clear message.varue
        session.beginDialog('pick_destination', { school_name: selected_school });
        return;
    }
    // load schools card template
    var schools_msg = require('./cards/1.schools.msg.json');
    // display schools options
    session.send(schools_msg);

}).triggerAction({matches: /scuba/i});


bot.dialog('pick_destination', function (session, options) {
    if (session.message && session.message.value) {
        // handle destination selection
        console.log('[pick_destination] Selected destination name -->');
        console.log(session.message.value);
        var selected_destination = session.message.value.destination;
        session.message.value = null;

        session.beginDialog('pick_people', { destination: selected_destination });
        return;
    }
    console.log('got options.school_name:');
    console.log(options.school_name);

    var destinations_msg = require('./cards/2.destinations.msg.json');

    console.log('[cards/2.destinations] got body text:');
    console.log(destinations_msg.attachments[0].content.body[0].text);
    // replace school name in card body text
    destinations_msg.attachments[0].content.body[0].text = destinations_msg.attachments[0].content.body[0].text.replace(/{{school}}/, options.school_name);
    // send destinations card 
    session.send(destinations_msg);
});

bot.dialog('pick_people', function (session, options) {
    if (session.message && session.message.value) {
        // handle people selection
        console.log('got session.message.value:');
        console.log(session.message.value);

        var number_of_people = session.message.value.numberOfPeople;
        session.message.value = null;

        session.beginDialog('pick_date', { people: number_of_people });
        return;
        //session.beginDialog('')
    }
    console.log('got options.destination:');
    console.log(options.destination);

    var people_msg = require('./cards/3.people.msg.json');
    // set destination name in card text
    people_msg.attachments[0].content.body[0].text = people_msg.attachments[0].content.body[0].text.replace(/{{destination}}/, options.destination);
    session.send(people_msg);

})

bot.dialog('pick_date', function (session, options) {
    if (session.message && session.message.value) {
        // handle people selection
        console.log('got session.message.value:');
        console.log(session.message.value);

        session.userData.selected_date = session.message.value.date;
        session.message.value = null;

        session.beginDialog('pick_lunch');
        return;
        //session.beginDialog('')
    }

    var date_msg = require('./cards/4.date.msg.json');
    date_msg.attachments[0].content.body[0].columns[0].items[0].text = date_msg.attachments[0].content.body[0].columns[0].items[0].text.replace('{{number_of_people}}', options.people);
    session.send(date_msg);
})

bot.dialog('pick_lunch', function (session, options) {
    if (session.message && session.message.value) {
        // handle card submit action
        session.userData.selected_lunch = session.message.value.mealOptions;
        session.message.value = null;

        session.beginDialog('personal_info');
        return;
    }

    var lunch_msg = require('./cards/5.lunch.msg.json');
    session.send(lunch_msg);
});

bot.dialog('personal_info', function (session, options) {
    if (session.message.value) {
        // handle people selection
        console.log('got session.message.value:');
        console.log(session.message.value);

        session.userData.personal_info = session.message.value.personalInfo;

        session.beginDialog('weather')
        return;
        //session.beginDialog('')
    }

    var personal_info_msg = require('./cards/6.personal-info.msg.json');
    session.send(personal_info_msg);
});

bot.dialog('weather', function (session, options) {

    var weather_msg = require('./cards/7.weather.msg.json');

    // weather_msg.text = weather_msg.text
    //     .replace(/{{name}})/, options.name)
    //     .replace(/{{email}}/, options.email)
    //     .replace(/{{phone}}/, options.phone)
    //     .replace(/{{school}}/, options.school)
    //     .replace(/{{destination}}/, options.destination);

    // weather_msg.attachments[0].content.speak = weather_msg.attachments[0].content.speak.replace(/{{weekday}}/, options.weekday);
    
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

bot.dialog('danger', function (session) {
    session.send(require('./cards/danger.msg.json'));
    session.endDialog();
})
// restart dialog handler
bot.dialog('restart', function (session) {
    session.beginDialog('welcome_user');
});

// END OF LINE
