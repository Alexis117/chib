function user (sequelize, DataTypes, Sequelize) {
    const User = sequelize.define('user', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            len: {
                args: [3,32],
                msg: "Name must have 3 or more chars"
            },
            notNull:{
                msg: "Missing arg name"
            }
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            len: {
                args: [3,32],
                msg: "Last name must have 3 or more chars"
            },
            notNull:{
                msg: "Missing arg lastName"
            }
        }
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'phoneNumber',
        validate: {
            validateCountryCode(value) {
                if (this.userType === "1" && !/1[0-9]{10}/.test(value)){
                  throw new Error('Phone number in US must begin with 1');
                }
                else if (this.userType === "2" && !/52[0-9]{10}/.test(value)){
                    throw new Error('Phone number in MX must begin with 52');
                }
            },
            is:{
                args: [/1|52[0-9]{10}/i],
                msg: "Phone number must be a country code (US/MX) + 10 digit number"
            },
            notNull:{
                msg: "Missing arg phoneNumber"
            }
        }
      },
      userType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['1', '2']],
                msg: "User type must be 1 or 2"
            },
            notNull:{
                msg: "Missing arg userType"
            }
        }
      }
    });

    User.associate = models => {
        User.hasMany(models.User, {as: 'beneficiaries', foreignKey: 'beneficiaryId', constraints: false})
        User.hasMany(models.User, {as: 'benefactors', foreignKey: 'benefactorsId', constraints: false})
        //User.belongsToMany(models.User, {as: 'benefactories'})
    };

    return User;
};

function card (sequelize, DataTypes, Sequelize) {
    const Card = sequelize.define('card', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      cardNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            isCreditCard:{
                args: true,
                msg: "Invalid card number format"
            },
            notNull:{
                msg: "Missing arg cardNumber"
            }
        }
      },
      expDate:{
          type: DataTypes.DATE,
          allowNull: false,
          validate:{
            notNull:{
                msg: "Missing arg expDate"
            },
            isDate:{
                args: true,
                msg: "Exp date must be in date format (YYYY-MM-DD)"
            }
        }
      }
    });

    Card.associate = models => {
        Card.belongsTo(models.User)
    };

    return Card;
};

export {
    user, card
}