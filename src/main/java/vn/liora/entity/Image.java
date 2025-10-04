package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "Images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdImage")
    private int imageId;

    @Column(name = "ImageUrl", columnDefinition = "VARCHAR(255)")
    private String imageUrl;

    @Column(name = "IdProduct")
    private Long productId;

}
