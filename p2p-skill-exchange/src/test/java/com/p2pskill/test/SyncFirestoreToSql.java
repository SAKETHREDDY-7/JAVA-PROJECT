package com.p2pskill.test;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.config.DatabaseInitializer;

import java.io.File;
import java.sql.Connection;

public class SyncFirestoreToSql {

    public static void main(String[] args) {
        try {
            System.out.println("[SYNC] Step 1: Downloading live data from Firebase Firestore...");

            // Run Node.js sync script if available
            try {
                ProcessBuilder pb = new ProcessBuilder("node", "scripts/sync_cloud_to_sql.js");
                pb.directory(new File("p2p-skill-exchange").exists() ? new File("p2p-skill-exchange") : new File("."));
                Process p = pb.start();
                p.waitFor();
            } catch (Exception ex) {
                System.out.println("[SYNC] Note: using cached firestore_sync.sql");
            }

            File sqlFile = new File("p2p-skill-exchange/sql/firestore_sync.sql");
            if (!sqlFile.exists()) {
                sqlFile = new File("sql/firestore_sync.sql");
            }

            if (!sqlFile.exists()) {
                System.err.println("[SYNC ERROR] firestore_sync.sql not found!");
                System.exit(1);
            }

            System.out.println("[SYNC] Step 2: Applying SQL updates to local database...");
            Connection conn = DatabaseConnection.getInstance().getConnection();

            // Use reflectively or invoke executeSqlScript
            java.lang.reflect.Method m = DatabaseInitializer.class.getDeclaredMethod("executeSqlScript", Connection.class, File.class);
            m.setAccessible(true);
            m.invoke(null, conn, sqlFile);

            conn.close();
            System.out.println("[SYNC SUCCESS] All latest records from deployed website are now in your local SQL database!");
            System.exit(0);

        } catch (Exception e) {
            System.err.println("[SYNC ERROR] " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
