package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CategoryMapper;
import vn.liora.repository.CategoryRepository;
import vn.liora.service.ICategoryService;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements ICategoryService {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CategoryMapper categoryMapper;
    @Override
    public Category createCategory(CategoryCreationRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }
        Category category = categoryMapper.toCategory(request);
        return categoryRepository.save(category);
    }

    @Override
    public CategoryResponse findById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return categoryMapper.toCategoryResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (request.getName() != null && !request.getName().equalsIgnoreCase(category.getName())
                && categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }

        categoryMapper.updateCategory(category, request);
        categoryRepository.save(category);

        return categoryMapper.toCategoryResponse(category);
    }

    @Override
    public void deleteById(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public Optional<Category> findByIdOptional(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public List<Category> findAllById(Iterable<Long> ids) {
        return categoryRepository.findAllById(ids);
    }

    @Override
    public List<Category> findAll(Sort sort) {
        return categoryRepository.findAll(sort);
    }

    @Override
    public Page<Category> findAll(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    @Override
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Override
    public <S extends Category> S save(S entity) {
        return categoryRepository.save(entity);
    }

    @Override
    public List<Category> findByNameContaining(String name) {
        return categoryRepository.findByNameContaining(name);
    }

    @Override
    public Page<Category> findByNameContaining(String name, Pageable pageable) {
        return categoryRepository.findByNameContaining(name, pageable);
    }

    @Override
    public Optional<Category> findByName(String name) {
        return categoryRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return categoryRepository.existsByName(name);
    }

    @Override
    public List<Category> findRootCategories() {
        return categoryRepository.findRootCategories();
    }

    @Override
    public List<Category> findChildCategories(Long parentId) {
        return categoryRepository.findChildCategories(parentId);
    }

    @Override
    public List<Category> findAllChildCategories() {
        return categoryRepository.findByParentCategoryNotNull();
    }

    @Override
    public boolean hasChildren(Long categoryId) {
        return categoryRepository.hasChildren(categoryId);
    }

    @Override
    public long count() {
        return categoryRepository.count();
    }

    @Override
    public List<Category> findActiveCategories() {
        return  categoryRepository.findByIsActiveTrue();
    }

    @Override
    public List<Category> findInactiveCategories() {
        return  categoryRepository.findByIsActiveFalse();
    }

    @Override
    public List<Category> findActiveRootCategories() {
        return categoryRepository.findByIsActiveTrueAndParentCategoryIsNull();
    }

    @Override
    public List<Category> findActiveChildCategories(Long parentId) {
        return categoryRepository.findByIsActiveTrueAndParentCategoryId(parentId);
    }

    @Override
    public void deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        category.setIsActive(false);
        categoryRepository.save(category);
    }

    @Override
    public void activateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        category.setIsActive(true);
        categoryRepository.save(category);
    }
}
