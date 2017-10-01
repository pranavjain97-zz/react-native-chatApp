import { _ } from 'loadash';
import faker from 'faker';
import Sequelize from 'sequelize';

//initialise out database
const db = new Sequelize('chatter', null, null, {
   dialaect: 'sqlite',
   storage: './chatter.sqlite',
   logging: true
});

//defining groups
const GroupModel = db.define('group', {
   name: { type: Sequelize.STRING }
});

//defining messages
const MessageModel = db.define('message', {
   text: { type: Sequelize.STRING }
});

const UserModel = db.define('user', {
   email: { type: Sequelize.STRING },
   username: { type: Sequelize.STRING },
   password: { type: Sequelize.STRING }
});

//users belong to multiple groups
UserModel.belongsToMany(GroupModel, { through: 'GroupUser' });

//users belong to multiple users as friends
UserModel.belongsToMany(UserModel, { through: 'Friends', as: 'friends' });

// messages are sent from users
MessageModel.belongsTo(UserModel);

// messages are sent from users
MessageModel.belongsTo(GroupModel);

// groups have multiple users
GroupModel.belongsToMany(UserModel, { through: 'GroupUser' });

//create fake starter data

const GROUPS = 4;
const USERS_PER_GROUP = 5;
const MESSAGES_PER_USER = 5;
faker.seed(123);

//faking groups, users and messages. //dont need to refer to this code.

db.sync({ force: true }).then(() =>
   _.times(GROUPS, () =>
      GroupModel.create({
         name: faker.lorem.words(3)
      })
         .then(group =>
            _.times(USERS_PER_GROUP, () => {
               const password = faker.internet.password();
               return group
                  .createUser({
                     email: faker.internet.email(),
                     username: faker.internet.userName(),
                     password
                  })
                  .then(user => {
                     console.log(
                        '{email, username, password}',
                        `{${user.email}, ${user.username}, ${password}}`
                     );
                     _.times(MESSAGES_PER_USER, () =>
                        MessageModel.create({
                           userId: user.id,
                           groupId: group.id,
                           text: faker.lorem.sentences(3)
                        })
                     );
                     return user;
                  });
            })
         )
         .then(userPromises => {
            // make users friends with all users in the group
            Promise.all(userPromises).then(users => {
               _.each(users, (current, i) => {
                  _.each(users, (user, j) => {
                     if (i !== j) {
                        current.addFriend(user);
                     }
                  });
               });
            });
         })
   )
);

const Group = db.models.group;
const Message = db.models.message;
const User = db.models.user;

export { Group, Message, User };
