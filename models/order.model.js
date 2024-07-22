const mongoose = require('mongoose');

const OrdersSchema = mongoose.Schema(
    {
        name: {
            type: String
        },
        // cust_id:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref:'Customer',
        //     required: [true, "Please Enter Customer ID"],
        // },
        phone:{
            type:Number,
            required: [true, "Please Enter Phone Number"],
        },
        email:{
            type:String,
            required: [true, "Please Enter Your Email"],
        },
        shoes: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Product',
            required: [true, "Please Enter Shoes"],
        },
        order_amt:{
            type: Number,
            required: true,
            default: 0            
        },
        order_date:{
            type: String,
            required: true
        },
        delv_date:{
            type: String,
            required: true
        }

    },
    {
        timestamps: true
    }
);
const Order=mongoose.model("Orders",OrdersSchema);
module.exports=Order;