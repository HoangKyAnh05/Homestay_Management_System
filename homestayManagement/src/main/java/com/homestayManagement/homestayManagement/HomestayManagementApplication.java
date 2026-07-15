package com.homestayManagement.homestayManagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HomestayManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(HomestayManagementApplication.class, args);
		System.out.println("Homestay Management Application Started");
	}

}
