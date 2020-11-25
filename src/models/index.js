import Sequelize from 'sequelize';
import DataTypes from 'sequelize';
import { user, card } from './models.js'

const sequelize = new Sequelize(
    process.env.DATABASE_URL
);

const models = {
    User: user(sequelize, DataTypes, Sequelize),
    Card: card(sequelize, DataTypes, Sequelize),
};

Object.keys(models).forEach(key => {
    if ('associate' in models[key]) {
      models[key].associate(models);
    }
});

export {
    sequelize,
    models
}