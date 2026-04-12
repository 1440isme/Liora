package vn.liora.Authen;

import vn.liora.entity.User;
import java.util.Map;

public interface LoginStrategy {
    User login(Map<String, Object> attributes);
    vn.liora.enums.AuthProvider getProvider();
}
