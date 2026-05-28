package com.elprofesor.collaborationtool.server.services;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);//Crée un dossier à la destination renseignée
        } catch (Exception ex) {
            throw new RuntimeException("Impossible de créer le répertoire où les fichiers téléchargés seront stockés.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        System.out.println("File : " + file.getOriginalFilename());
        System.out.println("Original file name : " + originalFileName);
        
        try {
            if(originalFileName.contains("..")) {
                throw new RuntimeException("Désolé! Le nom du fichier contient un chemin invalide " + originalFileName);
            }

            // Generate a unique file name
            String fileExtension = "";
            int lastIndex = originalFileName.lastIndexOf('.');//Extraction de l'extension du fichier à stocker
            if(lastIndex > 0) {
                fileExtension = originalFileName.substring(lastIndex);
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            System.out.println("File extension : " + fileExtension);
            System.out.println("Unique file name : " + uniqueFileName);

            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);//Chemin d'accès du fichier
            System.out.println("Target Location : " + targetLocation);
            System.out.println("getInputStream : " + file.getInputStream());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return uniqueFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Impossible de stocker le fichier " + originalFileName + ". Veuillez réessayer!", ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors de la suppression du fichier " + fileName, ex);
        }
    }
}
