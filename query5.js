const { MongoClient } = require("mongodb");

async function run() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("local");

        // 1. Kiểm tra phòng vượt quá số người
        const roomCheck = await db.collection("students").aggregate([
            {
                $group: {
                    _id: "$room_id",
                    student_count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "rooms",
                    localField: "_id",
                    foreignField: "_id",
                    as: "room_info"
                }
            },
            { $unwind: "$room_info" },
            {
                $project: {
                    room_id: "$_id",
                    student_count: 1,
                    max_people: "$room_info.max_people",
                    exceeded: { $gt: ["$student_count", "$room_info.max_people"] }
                }
            },
            { $match: { exceeded: true } }
        ]).toArray();

        console.log("\nPHÒNG QUÁ TẢI:");
        console.table(roomCheck);

        //2. Kiểm tra sinh viên đăng ký quá 2 xe vé tháng
        const vehicleCheck = await db.collection("vehicles").aggregate([
            {
                $group: {
                    _id: "$student_id",
                    vehicle_count: { $sum: 1 }
                }
            },
            {
                $match: { vehicle_count: { $gt: 2 } }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: "$student" },
            {
                $project: {
                    student_id: "$_id",
                    name: "$student.name",
                    vehicle_count: 1
                }
            }
        ]).toArray();

        console.log("\nSINH VIÊN CÓ QUÁ 2 XE:");
        console.table(vehicleCheck);

    } catch (err) {
        console.error("Lỗi truy vấn:", err);
    } finally {
        await client.close();
    }
}

run();
