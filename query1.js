const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("local"); // đổi tên nếu DB khác
        const students = db.collection("students");

        const result = await students.aggregate([
            {
                $lookup: {
                    from: "rooms",
                    localField: "room_id",
                    foreignField: "_id",
                    as: "room"
                }
            },
            { $unwind: "$room" },
            {
                $lookup: {
                    from: "student_services",
                    localField: "_id",
                    foreignField: "student_id",
                    as: "services"
                }
            },
            {
                $unwind: {
                    path: "$services",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    service_month: {
                        $cond: {
                            if: {
                                $or: [
                                    { $not: ["$services.used_at"] },
                                    { $eq: ["$services.used_at", null] }
                                ]
                            },
                            then: "2025-04",
                            else: { $substr: ["$services.used_at", 0, 7] }
                        }
                    },
                    service_total: {
                        $cond: {
                            if: { $eq: ["$services.total", null] },
                            then: 0,
                            else: "$services.total"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        student_id: "$_id",
                        name: "$name",
                        month: "$service_month",
                        room_price: "$room.price"
                    },
                    total_service_cost: { $sum: "$service_total" }
                }
            },
            {
                $project: {
                    student_id: "$_id.student_id",
                    name: "$_id.name",
                    month: "$_id.month",
                    room_price: "$_id.room_price",
                    service_cost: "$total_service_cost",
                    total_payment: { $add: ["$total_service_cost", "$_id.room_price"] }
                }
            },
            { $sort: { month: 1, student_id: 1 } }
        ]).toArray();

        console.log("Kết quả:");
        console.table(result);
    } catch (err) {
        console.error("Lỗi:", err);
    } finally {
        await client.close();
    }
}

run();
