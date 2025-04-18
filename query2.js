const { MongoClient } = require("mongodb");

async function run() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("local");
        const collection = db.collection("student_services");

        const pipeline = [
            {
                $match: {
                    used_at: {
                        $gte: "2025-01-01",
                        $lte: "2025-03-31"
                    }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "student_id",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: "$student" },
            {
                $lookup: {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $group: {
                    _id: {
                        student_id: "$student_id",
                        student_name: "$student.name",
                        service_name: "$service.name"
                    },
                    total_price: { $sum: "$total" }
                }
            },
            {
                $project: {
                    _id: 0,
                    student_id: "$_id.student_id",
                    student_name: "$_id.student_name",
                    service_name: "$_id.service_name",
                    total_price: 1
                }
            }
        ];

        const result = await collection.aggregate(pipeline).toArray();
        console.log("Kết quả:");
        console.table(result);
    } catch (err) {
        console.error("Lỗi truy vấn:", err);
    } finally {
        await client.close();
    }
}

run();
